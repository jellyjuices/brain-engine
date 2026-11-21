import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { notePaths } from "../core/files.ts";
import { updateIndex } from "../core/search.ts";
import { undoIdSince } from "../core/log.ts";
import { check } from "../reports/reports.ts";
import type { CheckIssue } from "./api-types.ts";

type Snapshot = Map<string, string>;

export function snapshot(root: string): Snapshot {
  const out: Snapshot = new Map();
  for (const path of notePaths(root)) {
    const s = statSync(join(root, path), { bigint: true });
    out.set(path, `${s.mtimeNs}:${s.size}`);
  }
  return out;
}

function changedSince(root: string, before: Snapshot): string[] {
  const after = snapshot(root);
  const changed = [...after].filter(([p, stamp]) => before.get(p) !== stamp).map(([p]) => p);
  const gone = [...before.keys()].filter((p) => !after.has(p));
  return [...changed, ...gone];
}

export function checkNotes(root: string, paths: string[]): CheckIssue[] {
  const wanted = new Set(paths.filter((p) => existsSync(join(root, p))));
  if (!wanted.size) return [];
  return check(root)
    .filter((r) => wanted.has(r.path))
    .flatMap((r) => r.issues.map((i) => ({ path: r.path, level: i.level, message: i.message })));
}

const isPlainObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x) && Object.getPrototypeOf(x) === Object.prototype;

export function withCheck(root: string, before: Snapshot, result: unknown): unknown {
  const changed = changedSince(root, before);
  if (!changed.length) return result;
  updateIndex(root);
  const issues = checkNotes(root, changed);
  return issues.length && isPlainObject(result) ? { ...result, check: issues } : result;
}

export function withUndoId(root: string, mark: number, result: unknown): unknown {
  const id = undoIdSince(root, mark);
  return id && isPlainObject(result) ? { ...result, undo_id: id } : result;
}
