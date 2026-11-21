import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { writeAtomic } from "../core/files.ts";
import { nowStamp } from "../core/notes.ts";
import type { Job, JobKind } from "../interface/api-types-jobs.ts";

export const ASK_KIND: Record<string, JobKind> = { split: "split", enrich: "enrich", intake: "questions" };
const ID = /^[0-9a-f]{8}$/;
const KEEP_DAYS = 30;

export function askOf(kind: JobKind): string | undefined {
  return Object.keys(ASK_KIND).find((a) => ASK_KIND[a] === kind);
}

function jobsDir(root: string): string {
  return join(root, ".brain", "jobs");
}

function jobFile(root: string, id: string): string {
  return join(jobsDir(root), `${id}.json`);
}

function readJob(root: string, file: string): Job | undefined {
  try {
    return JSON.parse(readFileSync(join(jobsDir(root), file), "utf8")) as Job;
  } catch {
    return undefined;
  }
}

export function listJobs(root: string): Job[] {
  if (!existsSync(jobsDir(root))) return [];
  return readdirSync(jobsDir(root))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJob(root, f))
    .filter((j): j is Job => !!j);
}

export function findJob(root: string, id: string): Job | undefined {
  return ID.test(id) && existsSync(jobFile(root, id)) ? readJob(root, `${id}.json`) : undefined;
}

export function saveJob(root: string, job: Job): Job {
  writeAtomic(jobFile(root, job.id), JSON.stringify(job, null, 2) + "\n");
  return job;
}

export function pairJob(root: string, note: string, kind: JobKind): Job | undefined {
  return listJobs(root).find((j) => j.note === note && j.kind === kind);
}

function fresh(job: Job): Job {
  return { id: job.id, kind: job.kind, note: job.note, state: "waiting", tries: job.tries, made: job.made, ...(job.session && { session: job.session }) };
}

export function queueJob(root: string, note: string, kind: JobKind): Job {
  const had = pairJob(root, note, kind);
  if (had && (had.state === "waiting" || had.state === "working")) return had;
  if (had) return saveJob(root, fresh(had));
  const job: Job = { id: randomBytes(4).toString("hex"), kind, note, state: "waiting", tries: 0, made: nowStamp() };
  return saveJob(root, job);
}

export function requeueJob(root: string, job: Job): Job {
  return saveJob(root, fresh(job));
}

export function nextJob(root: string): Job | undefined {
  const rank = (j: Job) => (j.kind === "intake_summary" ? 0 : 1);
  return listJobs(root)
    .filter((j) => j.state === "waiting")
    .sort((a, b) => rank(a) - rank(b) || a.made.localeCompare(b.made))[0];
}

export function recoverJobs(root: string): void {
  for (const job of listJobs(root).filter((j) => j.state === "working")) saveJob(root, { ...job, state: "waiting" });
}

export function pruneJobs(root: string, asksOf: (note: string) => string[]): void {
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  for (const job of listJobs(root)) {
    if (job.state !== "done" && job.state !== "failed") continue;
    if (Date.parse(job.finished ?? job.made) >= cutoff) continue;
    const ask = askOf(job.kind);
    if (ask && asksOf(job.note).includes(ask)) continue;
    unlinkSync(jobFile(root, job.id));
  }
}
