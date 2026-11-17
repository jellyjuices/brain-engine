import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { log, undoLast, type UndoStep } from "../core/log.ts";

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

/** Reverse the last change that is not undone yet. The CLI and the API share `undoLast`. */
export const undo = undoLast;
