import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { LOG_FILE, nowStamp, parse } from "./notes.ts";
import { writeAtomic } from "./files.ts";

/** The smallest block of lines that changed between two texts. */
export function diffLines(path: string, before: string, after: string): UndoStep {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  let start = 0;
  while (start < beforeLines.length && start < afterLines.length && beforeLines[start] === afterLines[start]) start++;
  let endA = beforeLines.length, endB = afterLines.length;
  while (endA > start && endB > start && beforeLines[endA - 1] === afterLines[endB - 1]) { endA--; endB--; }
  return { path, line: start, removed: beforeLines.slice(start, endA), added: afterLines.slice(start, endB) };
}

/** What `brain undo` needs to reverse one file change: at line `line`, `added` replaced `removed`. `file` marks a file the change made or deleted. */
export interface UndoStep {
  path: string;
  line: number;
  removed: string[];
  added: string[];
  file?: "made" | "gone";
}

export interface LogEntry {
  at: string;
  msg: string;
  /** Set on changes that `brain undo` can reverse. */
  id?: string;
  undo?: UndoStep[];
  /** Set on an undo entry: the id of the change it reversed. */
  undoes?: string;
}

/** Add one line to .log.jsonl. Append only: cheap, and easy for scripts and agents to read. */
export function log(root: string, message: string, extra: Omit<LogEntry, "at" | "msg"> = {}): void {
  appendFileSync(join(root, LOG_FILE), JSON.stringify({ at: nowStamp(), msg: message, ...extra } satisfies LogEntry) + "\n", "utf8");
}

/** The last n log entries, newest first. */
export function readLog(root: string, n = Infinity): LogEntry[] {
  const path = join(root, LOG_FILE);
  if (!existsSync(path)) return [];
  const out: LogEntry[] = [];
  for (const line of readFileSync(path, "utf8").split("\n").filter(Boolean)) {
    try {
      out.push(JSON.parse(line) as LogEntry);
    } catch {}
  }
  return out.slice(-n).reverse();
}

const readOrNull = (root: string, path: string) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : null);

function stepFor(path: string, before: string | null, after: string | null): UndoStep | undefined {
  if (before === after) return undefined;
  if (before === null) return { path, line: 0, removed: [], added: after!.split("\n"), file: "made" };
  if (after === null) return { path, line: 0, removed: before.split("\n"), added: [], file: "gone" };
  return diffLines(path, before, after);
}

/** Run a change on several files and log it as one entry, so one undo reverses all of it. A file may be made or deleted. */
export function changeFiles<T>(root: string, paths: string[], msg: string, fn: () => T): T {
  const unique = [...new Set(paths)];
  const before = unique.map((p) => readOrNull(root, p));
  const result = fn();
  const steps = unique.flatMap((p, i) => stepFor(p, before[i], readOrNull(root, p)) ?? []);
  log(root, msg, steps.length ? { id: randomBytes(4).toString("hex"), undo: steps } : {});
  return result;
}

function changedSince(step: UndoStep): string {
  return `${step.path} changed since. Undo it by hand:\n  now: ${step.added.join("\n       ")}\n  was: ${step.removed.join("\n       ")}`;
}

function planStep(root: string, step: UndoStep, pending: Map<string, string | null>): () => void {
  const full = join(root, step.path);
  const now = pending.has(step.path) ? pending.get(step.path)! : readOrNull(root, step.path);
  if (step.file === "made") {
    if (now !== step.added.join("\n")) throw new Error(changedSince(step));
    pending.set(step.path, null);
    return () => unlinkSync(full);
  }
  if (step.file === "gone") {
    if (now !== null) throw new Error(`${step.path} is back already. Nothing changed.`);
    pending.set(step.path, step.removed.join("\n"));
    return () => writeAtomic(full, step.removed.join("\n"));
  }
  if (now === null) throw new Error(changedSince(step));
  const lines = now.split("\n");
  if (lines.slice(step.line, step.line + step.added.length).join("\n") !== step.added.join("\n")) throw new Error(changedSince(step));
  lines.splice(step.line, step.added.length, ...step.removed);
  const text = lines.join("\n");
  if (parse(text).error) throw new Error(`Undo would break ${step.path}. Nothing changed.`);
  pending.set(step.path, text);
  return () => writeAtomic(full, text);
}

export function logMark(root: string): number {
  const path = join(root, LOG_FILE);
  return existsSync(path) ? statSync(path).size : 0;
}

export function undoIdSince(root: string, mark: number): string | undefined {
  const path = join(root, LOG_FILE);
  if (!existsSync(path)) return undefined;
  const fresh = readFileSync(path).subarray(mark).toString("utf8").split("\n").filter(Boolean);
  const ids = fresh.flatMap((line) => {
    try {
      const e = JSON.parse(line) as LogEntry;
      return e.id && e.undo ? [e.id] : [];
    } catch {
      return [];
    }
  });
  return ids.at(-1);
}

const isUndoable = (e: LogEntry, undone: Set<string>) => !!(e.id && e.undo && !undone.has(e.id));

function pickEntry(entries: LogEntry[], undone: Set<string>, id?: string): LogEntry {
  if (id) {
    const hit = entries.find((e) => e.id === id);
    if (!hit) throw new Error(`No change with id ${id}. Nothing changed.`);
    if (undone.has(id)) throw new Error(`${hit.msg} is undone already. Nothing changed.`);
    if (!isUndoable(hit, undone)) throw new Error(`${hit.msg} cannot be undone. Nothing changed.`);
    return hit;
  }
  const last = entries.find((e) => !e.undoes && !(e.id && undone.has(e.id)));
  if (!last) throw new Error("Nothing to undo.");
  if (!isUndoable(last, undone)) throw new Error(`The last change cannot be undone: ${last.msg}. Nothing changed.`);
  return last;
}

/** Reverse one change: the one with `id`, or else the newest one. Refuses when the newest change cannot be undone, so it never reaches past it. Every step is checked before any file changes. */
export function undoLast(root: string, id?: string): { msg: string; line: string } {
  const entries = readLog(root);
  const undone = new Set(entries.flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const last = pickEntry(entries, undone, id);
  const pending = new Map<string, string | null>();
  const plans = last.undo!.map((step) => planStep(root, step, pending));
  for (const apply of plans) apply();
  log(root, `undo: ${last.msg}`, { undoes: last.id });
  return { msg: last.msg, line: `Undone: ${last.msg}` };
}
