import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { parse } from "../core/notes.ts";
import { writeAtomic } from "../core/files.ts";
import { log, readLog, type UndoStep } from "../core/log.ts";

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

/** Run a change on one file and log it with what undo needs. */
export function change(root: string, path: string, msg: string, fn: () => void): void {
  const before = readFileSync(join(root, path), "utf8");
  fn();
  const after = readFileSync(join(root, path), "utf8");
  log(root, msg, { id: randomBytes(4).toString("hex"), undo: [diffLines(path, before, after)] });
}

/** Reverse the last change that is not undone yet. */
export function undo(root: string): { msg: string; line: string } {
  const entries = readLog(root);
  const undone = new Set(entries.flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const last = entries.find((e) => e.id && e.undo && !undone.has(e.id));
  if (!last) throw new Error("Nothing to undo.");
  for (const step of last.undo!) {
    const full = join(root, step.path);
    const lines = readFileSync(full, "utf8").split("\n");
    const here = lines.slice(step.line, step.line + step.added.length).join("\n") === step.added.join("\n");
    if (!here) throw new Error(`${step.path} changed since. Undo it by hand:\n  now: ${step.added.join("\n       ")}\n  was: ${step.removed.join("\n       ")}`);
    lines.splice(step.line, step.added.length, ...step.removed);
    const text = lines.join("\n");
    if (parse(text).error) throw new Error(`Undo would break ${step.path}. Nothing changed.`);
    writeAtomic(full, text);
  }
  log(root, `undo: ${last.msg}`, { undoes: last.id });
  return { msg: last.msg, line: `Undone: ${last.msg}` };
}
