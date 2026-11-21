import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadAll, readNote } from "../core/files.ts";
import { nowStamp } from "../core/notes.ts";
import { JOB_KINDS, type Job, type JobKind } from "../interface/api-types-jobs.ts";
import { helperConfig } from "./config.ts";
import { type Plan, writePlan } from "./plan.ts";
import { HelperError, REASONS, unload } from "./runner.ts";
import { ASK_KIND, askOf, findJob, nextJob, pairJob, pruneJobs, queueJob, recoverJobs, requeueJob, saveJob } from "./store.ts";

export type KindRun = (root: string, job: Job, signal: AbortSignal) => Promise<Plan>;

const NOT_BUILT = "This kind is not built yet.";

const notBuilt: KindRun = () => Promise.reject(new Error(NOT_BUILT));

export const KINDS = Object.fromEntries(JOB_KINDS.map((k) => [k, notBuilt])) as Record<JobKind, KindRun>;

interface Worker {
  started: boolean;
  running?: Promise<void>;
  again?: boolean;
  current?: { id: string; ctl: AbortController };
}

const WORKERS = new Map<string, Worker>();

function workerFor(root: string): Worker {
  const had = WORKERS.get(root);
  if (had) return had;
  const w: Worker = { started: false };
  WORKERS.set(root, w);
  return w;
}

function asksOf(root: string, note: string): string[] {
  if (!existsSync(join(root, note))) return [];
  const asks = readNote(root, note).meta.asks;
  return Array.isArray(asks) ? asks.map(String) : [];
}

function finish(root: string, job: Job, extra: Partial<Job>): Job {
  return saveJob(root, { ...job, ...extra, finished: nowStamp() });
}

function stillAsked(root: string, job: Job): boolean {
  const ask = askOf(job.kind);
  if (!ask) return true;
  if (!existsSync(join(root, job.note))) {
    finish(root, job, { state: "failed", reason: "The note is gone." });
    return false;
  }
  if (asksOf(root, job.note).includes(ask)) return true;
  finish(root, job, { state: "done", reason: "Done by another helper." });
  return false;
}

function reasonOf(e: unknown): string {
  if (e instanceof HelperError) return e.message;
  return e instanceof Error && e.message === NOT_BUILT ? NOT_BUILT : "Something went wrong.";
}

async function runOne(root: string, w: Worker, waiting: Job, model: string): Promise<"ran" | "skipped" | "down"> {
  if (!stillAsked(root, waiting)) return "skipped";
  const job = saveJob(root, { ...waiting, state: "working", tries: waiting.tries + 1, started: nowStamp(), by: model });
  const ctl = new AbortController();
  w.current = { id: job.id, ctl };
  try {
    const plan = await KINDS[job.kind](root, job, ctl.signal);
    if (ctl.signal.aborted || !stillAsked(root, job)) return "ran";
    finish(root, job, { state: "done", ...writePlan(root, plan) });
    return "ran";
  } catch (e) {
    if (ctl.signal.aborted) return "ran";
    if (e instanceof HelperError && e.reason === "down") {
      saveJob(root, { ...job, state: "waiting" });
      return "down";
    }
    finish(root, job, { state: "failed", reason: reasonOf(e) });
    return "ran";
  } finally {
    w.current = undefined;
  }
}

async function drain(root: string, w: Worker): Promise<void> {
  let ran = false;
  for (;;) {
    const cfg = helperConfig();
    const job = cfg && nextJob(root);
    if (!cfg || !job) break;
    const step = await runOne(root, w, job, cfg.model);
    if (step === "down") return;
    ran ||= step === "ran";
  }
  if (ran) await unload();
}

export function kickJobs(root: string): void {
  const w = workerFor(root);
  if (!w.started) return;
  if (w.running) {
    w.again = true;
    return;
  }
  w.running = drain(root, w)
    .catch(() => undefined)
    .finally(() => {
      w.running = undefined;
      if (w.again) {
        w.again = false;
        kickJobs(root);
      }
    });
}

export function jobsForAsks(root: string, note: string, asks: string[]): string[] {
  if (!helperConfig()) return [];
  const ids = asks.filter((a) => ASK_KIND[a]).map((a) => queueJob(root, note, ASK_KIND[a]).id);
  kickJobs(root);
  return ids;
}

function queueOpenAsks(root: string): void {
  for (const note of loadAll(root)) {
    const asks = Array.isArray(note.meta.asks) ? note.meta.asks.map(String) : [];
    for (const kind of asks.map((a) => ASK_KIND[a]).filter(Boolean)) if (!pairJob(root, note.path, kind)) queueJob(root, note.path, kind);
  }
}

export function startJobs(root: string): void {
  workerFor(root).started = true;
  recoverJobs(root);
  if (!helperConfig()) return;
  pruneJobs(root, (note) => asksOf(root, note));
  queueOpenAsks(root);
  kickJobs(root);
}

export function stopJob(root: string, job: Job): Job {
  if (job.state !== "waiting" && job.state !== "working") return job;
  const w = WORKERS.get(root);
  if (w?.current?.id === job.id) w.current.ctl.abort();
  return finish(root, job, { state: "failed", reason: REASONS.stopped });
}

export function retryJob(root: string, id: string): Job | undefined {
  const job = findJob(root, id);
  if (!job) return undefined;
  const next = job.state === "failed" ? requeueJob(root, job) : job;
  kickJobs(root);
  return next;
}

export function idleJobs(root: string): Promise<void> {
  return workerFor(root).running ?? Promise.resolve();
}
