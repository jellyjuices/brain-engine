import { join } from "node:path";
import { writeAtomic } from "../core/files.ts";
import { changeFiles, readLog } from "../core/log.ts";
import { DIRS, NOTE_DIRS, parse } from "../core/notes.ts";
import { updateIndex } from "../core/search.ts";
import type { JobResult } from "../interface/api-types-jobs.ts";

export interface PlanFile {
  path: string;
  text: string;
}

export interface Plan {
  msg: string;
  files: PlanFile[];
  counts: Record<string, number>;
}

const CLOSED = new Set(["me", DIRS.archive]);

function writable(path: string): boolean {
  const parts = path.split("/");
  if (parts.length < 2 || !path.endsWith(".md")) return false;
  if (parts.some((p) => !p || p.startsWith(".") || p.includes("\\") || p.includes("\0"))) return false;
  return NOTE_DIRS.includes(parts[0]) && !CLOSED.has(parts[0]);
}

function checkPlan(plan: Plan): void {
  const bad = plan.files.find((f) => !writable(f.path) || parse(f.text).error);
  if (bad) throw new Error(`The job tried to write ${bad.path}, which it may not.`);
}

export function writePlan(root: string, plan: Plan): { result: JobResult; undo_id?: string } {
  checkPlan(plan);
  const result: JobResult = { counts: { ...plan.counts }, paths: plan.files.map((f) => f.path) };
  if (!plan.files.length) return { result };
  changeFiles(root, result.paths, plan.msg, () => {
    for (const f of plan.files) writeAtomic(join(root, f.path), f.text);
  });
  updateIndex(root);
  const id = readLog(root, 1)[0]?.id;
  return { result, ...(id && { undo_id: id }) };
}
