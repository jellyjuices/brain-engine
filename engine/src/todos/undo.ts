import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { diffLines, log, undoLast } from "../core/log.ts";

export function change(root: string, path: string, msg: string, fn: () => void): void {
  const before = readFileSync(join(root, path), "utf8");
  fn();
  const after = readFileSync(join(root, path), "utf8");
  log(root, msg, { id: randomBytes(4).toString("hex"), undo: [diffLines(path, before, after)] });
}

export const undo = undoLast;
