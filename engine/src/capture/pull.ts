import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { capture } from "./actions.ts";
import { fileInto, splitPrefix, subjectsNamed, whenFrom, type When } from "./file.ts";
import { pickedHome } from "./picked.ts";
import { guessHome, type SortGuess } from "../../shared/sort/index.ts";
import { guessFor, sortSubjects } from "../sort/guess.ts";
import type { Embedder } from "../core/embed.ts";
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
  into?: string;
  about?: string[];
  people?: string[];
  by?: string;
  kind?: "todo" | "fact" | "feeling";
  when?: string;
  side?: string;
}

export interface PullResult {
  pulled: number;
  filed: number;
  skipped: number;
  acked: number;
}

export function relayEnvPath(): string {
  return process.env.BRAIN_RELAY_ENV || join(homedir(), ".config", "brain", "relay.env");
}

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

function filedNote(notes: Note[], into: unknown): Note | undefined {
  if (typeof into !== "string") return undefined;
  const note = notes.find((x) => x.path === into);
  if (!note || folderOf(note) === "inbox" || folderOf(note) === DIRS.archive || typeOf(note) === "Capture") return undefined;
  return note;
}

const sortText = (item: PendingItem) => splitPrefix(item.text).text;

const needsGuess = (item: PendingItem) => !item.into && !item.about?.length && !item.people?.length && !item.tags?.length;

export async function guessItem(root: string, item: PendingItem, embedder: Embedder | null): Promise<SortGuess | undefined> {
  return needsGuess(item) ? guessFor(root, loadAll(root), sortText(item), embedder) : undefined;
}

export async function saveSorted(root: string, item: PendingItem, embedder: Embedder | null = null) {
  return saveItem(root, item, await guessItem(root, item, embedder));
}

export const phoneMark = (id: string) => `(phone ${id})`;

function whenOfItem(item: PendingItem): { w: When; text: string } {
  const explicit = item.when ? whenFrom(item.when) : undefined;
  if (item.kind === "fact" || item.kind === "feeling") return { w: { kind: "note" }, text: item.text.trim() };
  if (explicit) return { w: explicit, text: item.text.trim() };
  const { when, text } = splitPrefix(item.text);
  return { w: when ?? (item.kind === "todo" ? { kind: "date" } : { kind: "note" }), text };
}

function fileOnNote(root: string, notes: Note[], target: Note, item: PendingItem, picked: { with: string[]; re: string[] }, check: boolean): void {
  const { w, text } = whenOfItem(item);
  const hits = subjectsNamed(notes, text).filter((n) => n.path !== target.path);
  const people = [...new Set([...picked.with, ...hits.filter((n) => typeOf(n) === "Person").map((n) => n.path)])].filter((p) => p !== target.path);
  const re = [...new Set([...picked.re, ...hits.filter((n) => typeOf(n) !== "Person").map((n) => n.path)])].filter((p) => p !== target.path);
  const date = (item.created_at ?? "").slice(0, 10) || undefined;
  change(root, target.path, `added to ${target.path}: ${text} ${phoneMark(item.client_id)}`, () => {
    fileInto(root, notes, target.path, text, w, { with: people, re, date, check, ...(item.kind === "feeling" && { feeling: true, about: item.side }) });
  });
}

export const alreadyFiled = (root: string, id: string) => readLog(root).some((e) => e.msg.endsWith(phoneMark(id)));

function chosenHome(notes: Note[], item: PendingItem, picked: { target?: Note }, guess: SortGuess | undefined): { target?: Note; check: boolean } {
  const chosen = filedNote(notes, item.into) ?? picked.target;
  if (chosen) return { target: chosen, check: false };
  const sorted = guess ?? guessHome(sortText(item), sortSubjects(notes), []);
  return { target: filedNote(notes, sorted.into ?? undefined), check: !sorted.sure };
}

export function saveItem(root: string, item: PendingItem, guess?: SortGuess, hold = false): { saved: "filed" | "inbox" | "skipped"; path?: string } {
  const notes = loadAll(root);
  const existing = notes.find((n) => n.meta.client_id === item.client_id);
  if (existing) return { saved: "skipped", path: existing.path };
  if (alreadyFiled(root, item.client_id)) return { saved: "skipped" };
  const picked = pickedHome(notes, item);
  const { target, check } = hold ? { target: undefined, check: false } : chosenHome(notes, item, picked, guess);
  if (target) {
    fileOnNote(root, notes, target, item, picked, check);
    return { saved: "filed", path: target.path };
  }
  const note = capture(root, { text: item.text, tags: item.tags, clientId: item.client_id, createdAt: item.created_at, by: item.by });
  return { saved: "inbox", path: note.path };
}

export async function pull(root: string, cfg: RelayConfig): Promise<PullResult> {
  const body = (await (await relay(cfg, "/relay/pending")).json()) as { items?: unknown[] };
  const items = (body.items ?? []).filter(isPending);
  const safe: string[] = [];
  let pulled = 0;
  let filed = 0;
  for (const item of items) {
    const { saved } = await saveSorted(root, item);
    safe.push(item.client_id);
    if (saved !== "skipped") pulled += 1;
    if (saved === "filed") filed += 1;
  }
  if (safe.length) await relay(cfg, "/relay/ack", { method: "POST", body: JSON.stringify({ client_ids: safe }) });
  return { pulled, filed, skipped: safe.length - pulled, acked: safe.length };
}
