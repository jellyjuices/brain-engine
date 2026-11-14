// brain pull: fetch captures stored by the relay Worker, write them to inbox/, then ack them.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { capture } from "./actions.ts";
import { bestHome, fileInto, namesAPerson, splitPrefix, subjectsNamed } from "./file.ts";
import { pickedHome } from "./picked.ts";
import { DIRS, folderOf, type Note, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { readLog } from "../core/log.ts";
import { change } from "../todos/undo.ts";

export interface RelayConfig {
  url: string;
  token: string;
}

export interface PendingItem {
  client_id: string;
  created_at?: string;
  text: string;
  tags?: string[];
  /** A note path from "+ Add here" on the phone. */
  into?: string;
  /** Note paths the owner picked under About what? */
  about?: string[];
  /** Person note paths the owner picked. */
  people?: string[];
  /** Who wrote it, when it was not the owner. */
  by?: string;
}

export interface PullResult {
  pulled: number;
  /** How many of `pulled` went straight into a subject note instead of the inbox. */
  filed: number;
  skipped: number;
  acked: number;
}

export function relayEnvPath(): string {
  return process.env.BRAIN_RELAY_ENV || join(homedir(), ".config", "brain", "relay.env");
}

/** Read KEY=value lines. Returns null when the file is missing or incomplete. */
export function readRelayConfig(path = relayEnvPath()): RelayConfig | null {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return null;
  }
  const vars: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) vars[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  if (!vars.RELAY_URL || !vars.RELAY_TOKEN) return null;
  return { url: vars.RELAY_URL.replace(/\/+$/, ""), token: vars.RELAY_TOKEN };
}

async function relay(cfg: RelayConfig, path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(cfg.url + path, { ...init, headers: { "X-Relay-Token": cfg.token, "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`The relay answered ${res.status} for ${path}`);
  return res;
}

function isPending(x: unknown): x is PendingItem {
  const i = x as PendingItem;
  return !!i && typeof i.client_id === "string" && typeof i.text === "string";
}

/** The note the phone named, when it is a filed note that exists. Otherwise undefined (the text goes to the inbox). */
function filedNote(notes: Note[], into: unknown): Note | undefined {
  if (typeof into !== "string") return undefined;
  const note = notes.find((x) => x.path === into);
  if (!note || folderOf(note) === "inbox" || folderOf(note) === DIRS.archive || typeOf(note) === "Capture") return undefined;
  return note;
}

function homeFromText(notes: Note[], input: string): Note | undefined {
  const { when, text } = splitPrefix(input);
  if (when?.kind !== "note" && namesAPerson(notes, text)) return undefined;
  const named = subjectsNamed(notes, text)[0];
  if (named) return named;
  if (!when) return undefined;
  return filedNote(notes, bestHome(notes, text).into);
}

const phoneMark =(id: string) => `(phone ${id})`;

/** File one phone item in its note. A When prefix picks to-do or date; with none it is a dated note line. */
function fileOnNote(root: string, notes: Note[], target: Note, item: PendingItem, picked: { with: string[]; re: string[] }): void {
  const { when, text } = splitPrefix(item.text);
  // DECISION: with no When prefix, a note the phone chose gets a dated note line (a fact), not a guessed to-do.
  const w = when ?? { kind: "note" as const };
  const hits = subjectsNamed(notes, text).filter((n) => n.path !== target.path);
  const people = [...new Set([...picked.with, ...hits.filter((n) => typeOf(n) === "Person").map((n) => n.path)])].filter((p) => p !== target.path);
  const re = [...new Set([...picked.re, ...hits.filter((n) => typeOf(n) !== "Person").map((n) => n.path)])].filter((p) => p !== target.path);
  const date = (item.created_at ?? "").slice(0, 10) || undefined;
  change(root, target.path, `added to ${target.path}: ${text} ${phoneMark(item.client_id)}`, () => {
    fileInto(root, notes, target.path, text, w, { with: people, re, date });
  });
}

const alreadyFiled = (root: string, id: string) => readLog(root).some((e) => e.msg.endsWith(phoneMark(id)));

/** Save one app item: on its note when `into` names a filed note, else in the inbox. "skipped" = already saved. */
export function saveItem(root: string, item: PendingItem): { saved: "filed" | "inbox" | "skipped"; path?: string } {
  const notes = loadAll(root);
  const existing = notes.find((n) => n.meta.client_id === item.client_id);
  if (existing) return { saved: "skipped", path: existing.path };
  if (alreadyFiled(root, item.client_id)) return { saved: "skipped" };
  const picked = pickedHome(notes, item);
  const target = filedNote(notes, item.into) ?? picked.target ?? homeFromText(notes, item.text);
  if (target) {
    fileOnNote(root, notes, target, item, picked);
    return { saved: "filed", path: target.path };
  }
  const note = capture(root, { text: item.text, tags: item.tags, clientId: item.client_id, createdAt: item.created_at, by: item.by });
  return { saved: "inbox", path: note.path };
}

/** Write each item (skipping ones already on disk), then ack. Write always comes before ack. */
export async function pull(root: string, cfg: RelayConfig): Promise<PullResult> {
  const body = (await (await relay(cfg, "/relay/pending")).json()) as { items?: unknown[] };
  const items = (body.items ?? []).filter(isPending);
  const safe: string[] = [];
  let pulled = 0;
  let filed = 0;
  for (const item of items) {
    const { saved } = saveItem(root, item);
    safe.push(item.client_id);
    if (saved !== "skipped") pulled += 1;
    if (saved === "filed") filed += 1;
  }
  if (safe.length) await relay(cfg, "/relay/ack", { method: "POST", body: JSON.stringify({ client_ids: safe }) });
  return { pulled, filed, skipped: safe.length - pulled, acked: safe.length };
}
