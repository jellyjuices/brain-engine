import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fakeHelper, helperOff, helperOn, MODEL } from "./helper-fake.ts";
import { issueAgentToken } from "../src/interface/server-agent.ts";
import { idleJobs, KINDS, startJobs } from "../src/helper/worker.ts";
import { findJob, listJobs, pruneJobs } from "../src/helper/store.ts";
import { readLog } from "../src/core/log.ts";
import type { Job } from "../src/interface/api-types-jobs.ts";
import { apiBrain, type Api, startApi } from "./api-helpers.ts";

const SHED = "projects/garden-shed.md";
const SHED_SPLIT = "---\ntype: Project\ntitle: Garden shed\ndescription: Build a small shed.\n---\n\n# To-dos\n\n- [ ] Buy cedar boards · check\n\n# Notes\n";
const NOTE_DONE = "---\ntype: Note\ntitle: shed-plan\ndescription: A file.\n---\n\nBuy cedar boards.\n";
const FILE = { title: "Shed build plan", text: "Buy cedar boards. Ask Alex about the permit.", asks: ["split"] };

async function apiWithHelper(t: { after: (fn: () => void) => void }, on: boolean): Promise<Api> {
  const fake = await fakeHelper();
  t.after(fake.close);
  if (on) helperOn(fake.url);
  else helperOff();
  const api = await startApi();
  t.after(api.close);
  return api;
}

function seedJob(root: string, job: Partial<Job>): Job {
  const full: Job = { id: "a1b2c3d4", kind: "split", note: "resources/shed-plan.md", state: "waiting", tries: 0, made: "2026-11-20T09:00:00", ...job };
  mkdirSync(join(root, ".brain", "jobs"), { recursive: true });
  writeFileSync(join(root, ".brain", "jobs", `${full.id}.json`), JSON.stringify(full));
  return full;
}

function seedFileNote(root: string, slug: string, asks: string[]): string {
  const path = `resources/${slug}.md`;
  mkdirSync(join(root, "resources"), { recursive: true });
  writeFileSync(join(root, path), `---\ntype: Note\ntitle: ${slug}\ndescription: A file.\nasks: [${asks.join(", ")}]\n---\n\nBuy cedar boards.\n`);
  return path;
}

test("with no helper, GET /api/jobs answers off and no jobs", async (t) => {
  const api = await apiWithHelper(t, false);
  const jobs = await api.call("GET", "/api/jobs");
  assert.deepEqual(jobs.data, { helper: "off", jobs: [] });
});

test("with no helper, a start answers 409 in owner words", async (t) => {
  const api = await apiWithHelper(t, false);
  const start = await api.call("POST", "/api/jobs", { kind: "split", note: "resources/shed-plan.md" });
  assert.deepEqual([start.status, start.data.error], [409, "No helper is set up on your home server."]);
});

test("with no helper, a file with asks makes no job records", async (t) => {
  const api = await apiWithHelper(t, false);
  const added = await api.call("POST", "/api/files", FILE);
  assert.deepEqual([added.data.jobs, existsSync(join(api.root, ".brain", "jobs"))], [undefined, false]);
});

test("with the helper on, a file with split makes one waiting job that holds no note text", async (t) => {
  const api = await apiWithHelper(t, true);
  const added = await api.call("POST", "/api/files", FILE);
  const [job] = listJobs(api.root);
  const record = readFileSync(join(api.root, ".brain", "jobs", `${job.id}.json`), "utf8");
  assert.deepEqual([added.data.jobs, job.kind, job.note, job.state, record.includes("cedar")], [[job.id], "split", added.data.path, "waiting", false]);
});

test("a second start for the same note and kind returns the same job", async (t) => {
  const api = await apiWithHelper(t, true);
  const note = seedFileNote(api.root, "shed-plan", ["split"]);
  const first = await api.call("POST", "/api/jobs", { kind: "split", note });
  const again = await api.call("POST", "/api/jobs", { kind: "split", note });
  assert.deepEqual([again.data.job.id, listJobs(api.root).length], [first.data.job.id, 1]);
});

test("a start for a kind the note does not ask for is 400", async (t) => {
  const api = await apiWithHelper(t, true);
  const note = seedFileNote(api.root, "shed-plan", ["split"]);
  const start = await api.call("POST", "/api/jobs", { kind: "enrich", note });
  assert.deepEqual([start.status, start.data.error], [400, "This note does not ask for that."]);
});

test("an agent cannot start a job", async (t) => {
  const api = await apiWithHelper(t, true);
  const note = seedFileNote(api.root, "shed-plan", ["split"]);
  const start = await api.call("POST", "/api/jobs", { kind: "split", note }, issueAgentToken(api.agentFile));
  assert.equal(start.status, 403);
});

test("a working job is waiting again after a restart", () => {
  helperOff();
  const root = apiBrain();
  const job = seedJob(root, { state: "working", started: "2026-11-20T09:01:00" });
  startJobs(root);
  assert.equal(findJob(root, job.id)?.state, "waiting");
});

test("the worker fails a kind that is not built yet and unloads the model after", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  const root = apiBrain();
  const note = seedFileNote(root, "shed-plan", ["split"]);
  startJobs(root);
  await idleJobs(root);
  const [job] = listJobs(root);
  assert.deepEqual([job.note, job.state, job.reason, job.by, fake.seen.map((s) => s.body.keep_alive)], [note, "failed", "This kind is not built yet.", MODEL, [0]]);
});

test("a job whose ask is gone is done by another helper", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  const root = apiBrain();
  const note = seedFileNote(root, "shed-plan", []);
  const job = seedJob(root, { note });
  startJobs(root);
  await idleJobs(root);
  assert.deepEqual([findJob(root, job.id)?.state, findJob(root, job.id)?.reason], ["done", "Done by another helper."]);
});

test("two jobs never run at once", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  const root = apiBrain();
  seedFileNote(root, "shed-plan", ["split"]);
  seedFileNote(root, "roof-notes", ["split"]);
  const seen: number[] = [];
  const real = KINDS.split;
  t.after(() => (KINDS.split = real));
  KINDS.split = async (r) => {
    seen.push(listJobs(r).filter((j) => j.state === "working").length);
    await new Promise((done) => setImmediate(done));
    return { msg: "split: nothing found", files: [], counts: { items: 0 } };
  };
  startJobs(root);
  await idleJobs(root);
  assert.deepEqual([seen, listJobs(root).map((j) => j.state)], [[1, 1], ["done", "done"]]);
});

test("a finished job writes its plan as one change with an undo id and keeps paths and counts only", async (t) => {
  const fake = await fakeHelper();
  t.after(fake.close);
  helperOn(fake.url);
  const root = apiBrain();
  const note = seedFileNote(root, "shed-plan", ["split"]);
  const real = KINDS.split;
  t.after(() => (KINDS.split = real));
  KINDS.split = async () => ({ msg: `split: ${note}`, files: [{ path: SHED, text: SHED_SPLIT }, { path: note, text: NOTE_DONE }], counts: { todos: 1 } });
  startJobs(root);
  await idleJobs(root);
  const [job] = listJobs(root);
  const [entry] = readLog(root, 1);
  assert.deepEqual([job.state, job.result, job.undo_id, entry.undo?.length, readFileSync(join(root, SHED), "utf8")], ["done", { counts: { todos: 1 }, paths: [SHED, note] }, entry.id, 2, SHED_SPLIT]);
});

test("a stop during the model call writes nothing, even when the call then returns a plan", async (t) => {
  const api = await apiWithHelper(t, true);
  const note = seedFileNote(api.root, "shed-plan", ["split"]);
  const shedBefore = readFileSync(join(api.root, SHED), "utf8");
  const real = KINDS.split;
  t.after(() => (KINDS.split = real));
  KINDS.split = (_r, _job, signal) => new Promise((done) => signal.addEventListener("abort", () => done({ msg: `split: ${note}`, files: [{ path: SHED, text: SHED_SPLIT }], counts: { todos: 1 } })));
  startJobs(api.root);
  const [job] = listJobs(api.root);
  const stop = await api.call("POST", "/api/jobs/stop", { id: job.id });
  await idleJobs(api.root);
  const after = findJob(api.root, job.id);
  assert.deepEqual([stop.data.job.reason, after?.state, after?.reason, readFileSync(join(api.root, SHED), "utf8"), readLog(api.root).length], ["Stopped.", "failed", "Stopped.", shedBefore, 0]);
});

test("the 30-day clean-up keeps an old record whose note still asks and deletes one whose does not", () => {
  const root = apiBrain();
  const asking = seedFileNote(root, "shed-plan", ["split"]);
  const done = seedFileNote(root, "roof-notes", []);
  seedJob(root, { id: "0000aaaa", note: asking, state: "done", finished: "2025-01-10T09:00:00" });
  seedJob(root, { id: "0000bbbb", note: done, state: "failed", reason: "Stopped.", finished: "2025-01-10T09:00:00" });
  pruneJobs(root, (path) => (path === asking ? ["split"] : []));
  assert.deepEqual(listJobs(root).map((j) => j.id), ["0000aaaa"]);
});

test("a retry puts a failed job back to waiting", async (t) => {
  const api = await apiWithHelper(t, true);
  const job = seedJob(api.root, { state: "failed", reason: "The helper's answer could not be read.", finished: "2026-11-20T09:02:00" });
  const retry = await api.call("POST", "/api/jobs/retry", { id: job.id });
  assert.deepEqual([retry.data.job.state, retry.data.job.reason], ["waiting", undefined]);
});
