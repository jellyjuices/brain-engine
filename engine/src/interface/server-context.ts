import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { join } from "node:path";
import { buildCard, isSubject } from "../reports/card.ts";
import { DIRS, type Note, NOTE_DIRS, summary } from "../core/notes.ts";
import { readNote } from "../core/files.ts";
import { backlinks } from "../reports/find.ts";
import { updateIndex } from "../core/search.ts";
import { HttpError, MAX_BODY } from "./server-auth.ts";
import type { Caller } from "./api-types.ts";

export const hash = (text: string) => createHash("sha256").update(text).digest("hex");
export const fileText = (root: string, path: string) => readFileSync(join(root, path), "utf8");

/** A note path from the URL. Only note folders; sources/ and hidden folders stay out; .archive reads only. */
export function safeNotePath(raw: string, write: boolean): string {
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    throw new HttpError(400, "That path is not valid.");
  }
  const parts = path.split("/");
  const bad = !path || path.includes("\0") || path.includes("\\") || path.startsWith("/") || !path.endsWith(".md") || parts.length < 2;
  if (bad || parts.some((p, i) => !p || p === "." || p === ".." || (p.startsWith(".") && !(i === 0 && p === DIRS.archive)))) throw new HttpError(400, "That path is not valid.");
  if (!NOTE_DIRS.includes(parts[0])) throw new HttpError(403, "That folder is not open to the phone.");
  if (write && parts[0] === DIRS.archive) throw new HttpError(403, "Archived notes are read only.");
  return path;
}

export function existingNote(root: string, path: string): Note {
  if (!existsSync(join(root, path))) throw new HttpError(404, `No note at ${path}.`);
  return readNote(root, path);
}

/** One note as the phone gets it. `hash` is what `PUT` sends back as `base`. */
export function noteJson(root: string, n: Note) {
  return { ...summary(n), meta: n.meta, body: n.body, hash: hash(fileText(root, n.path)) };
}

export function fullNoteJson(root: string, notes: Note[], n: Note) {
  const card = isSubject(n) ? buildCard(root, notes, n) : undefined;
  return { ...noteJson(root, n), backlinks: backlinks(notes, n.path), ...(card && { card }) };
}

export interface Ctx {
  root: string;
  url: URL;
  body: Record<string, unknown>;
  caller?: Caller;
  agentFile?: string;
}

export function textList(v: unknown, name: string): string[] | undefined {
  if (v === undefined || v === null) return undefined;
  if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) throw new HttpError(400, `"${name}" must be a list of text.`);
  return v;
}

export const text = (v: unknown, name: string, required = true): string | undefined => {
  if (v === undefined || v === null || v === "") {
    if (required) throw new HttpError(400, `Missing "${name}".`);
    return undefined;
  }
  if (typeof v !== "string") throw new HttpError(400, `"${name}" must be text.`);
  return v;
};

/** Verbs throw plain Errors for things like "No open to-do matches". Those are the caller's mistake: 400. */
export function asUserError<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, (err as Error).message);
  }
}

export function afterWrite<T>(root: string, fn: () => T): T {
  const result = fn();
  updateIndex(root);
  refreshMenuBar();
  return result;
}

/**
 * Ask SwiftBar to redraw the menu bar icon, so the inbox count is right at once (it also redraws every 5 minutes).
 * Only the background server does this. Tests and `--foreground` runs never touch SwiftBar.
 */
function refreshMenuBar(): void {
  if (process.env.XPC_SERVICE_NAME !== "com.brain.serve") return;
  execFile("open", ["-g", "swiftbar://refreshplugin?plugin=brain.5m.sh"], () => {});
}

export async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY) throw new HttpError(413, "That is too big. The limit is 256 KB.");
    chunks.push(chunk as Buffer);
  }
  if (!size) return {};
  try {
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  } catch {}
  throw new HttpError(400, "The body must be a JSON object.");
}
