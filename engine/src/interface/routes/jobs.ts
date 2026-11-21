import { helperConfig } from "../../helper/config.ts";
import { helperAnswering, REASONS, warm } from "../../helper/runner.ts";
import { ASK_KIND, askOf, findJob, listJobs, queueJob } from "../../helper/store.ts";
import { kickJobs, retryJob, stopJob } from "../../helper/worker.ts";
import type { Job, JobKind, JobResponse, JobsResponse, WarmResponse } from "../api-types-jobs.ts";
import { HttpError } from "../server-auth.ts";
import { type Ctx, existingNote, safeNotePath, text } from "../server-context.ts";

const STARTABLE = Object.values(ASK_KIND);

function needHelper(): void {
  if (!helperConfig()) throw new HttpError(409, REASONS.off);
}

function jobById(c: Ctx): Job {
  const id = text(c.body.id, "id")!;
  const job = findJob(c.root, id);
  if (!job) throw new HttpError(404, `No job ${id}.`);
  return job;
}

export function jobsRoute(c: Ctx): JobsResponse {
  if (!helperConfig()) return { helper: "off", jobs: [] };
  const note = c.url.searchParams.get("note");
  const jobs = listJobs(c.root)
    .filter((j) => !note || j.note === note)
    .sort((a, b) => b.made.localeCompare(a.made));
  return { helper: helperAnswering() ? "on" : "not answering", jobs };
}

export function startJob(c: Ctx): JobResponse {
  needHelper();
  const kind = text(c.body.kind, "kind") as JobKind;
  if (!STARTABLE.includes(kind)) throw new HttpError(400, `"kind" must be one of: ${STARTABLE.join(", ")}.`);
  const note = safeNotePath(text(c.body.note, "note")!, true);
  const asks = existingNote(c.root, note).meta.asks;
  if (!Array.isArray(asks) || !asks.includes(askOf(kind))) throw new HttpError(400, "This note does not ask for that.");
  const job = queueJob(c.root, note, kind);
  kickJobs(c.root);
  return { job };
}

export function retryJobRoute(c: Ctx): JobResponse {
  needHelper();
  return { job: retryJob(c.root, jobById(c).id)! };
}

export function stopJobRoute(c: Ctx): JobResponse {
  return { job: stopJob(c.root, jobById(c)) };
}

export function warmHelper(): WarmResponse {
  if (!helperConfig()) return { helper: "off" };
  void warm().catch(() => undefined);
  return { helper: "on" };
}
