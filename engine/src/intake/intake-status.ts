import { folderOf, type Note, str, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { lensPath, lensPrivacy, readSettings, STAGES, stagesDone, THREAD_STATUS, type ThreadStatus } from "./lenses.ts";
import { intakeBlocks } from "./lens-answers.ts";
import { type LastQuestion, lastQuestion } from "./intake-resume.ts";
import { listThreads } from "./threads.ts";

export type StageState = "done" | "started" | "not started" | "skipped";

export interface StageStatus {
  n: number;
  key: string;
  name: string;
  state: StageState;
  sessions: number;
  privacy?: string;
  doneAt?: string;
}

export interface IntakeStatus {
  stages: StageStatus[];
  next?: StageStatus;
  current?: { n: number; name: string };
  openThreads: number;
  lastQuestion?: LastQuestion;
  threads: Record<ThreadStatus, number>;
  openLoops: { captured: number; inInbox: number; sorted: number };
}

export function intakeStatus(root: string, notes = loadAll(root)): IntakeStatus {
  const settings = readSettings(root);
  const done = stagesDone(settings);
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const intake = notes.filter((n) => typeOf(n) === "Capture" && (Array.isArray(n.meta.tags) ? n.meta.tags.map(String) : []).includes("intake") && n.meta.outcome !== "drop");
  const stages = STAGES.map((s): StageStatus => {
    const lensNotes = s.lenses.map((l) => byPath.get(lensPath(l))).filter((n): n is Note => !!n);
    const sessions = lensNotes.reduce((k, n) => k + intakeBlocks(n).length, 0);
    const privs = s.lenses.map((l) => lensPrivacy(root, l));
    const base = { n: s.n, key: s.key, name: s.name, sessions, privacy: privs.length ? [...new Set(privs)].join(", ") : undefined };
    if (done[s.key]) return { ...base, state: "done", doneAt: String(done[s.key]) };
    if (privs.length && privs.every((p) => p === "skip")) return { ...base, state: "skipped" };
    if (s.key === "setup") return { ...base, state: str(settings.called) ? "started" : "not started" };
    if (s.key === "dump") return { ...base, state: intake.length ? "started" : "not started", sessions: 0 };
    return { ...base, state: sessions ? "started" : "not started" };
  });
  const threads = Object.fromEntries(THREAD_STATUS.map((s) => [s, 0])) as Record<ThreadStatus, number>;
  for (const thread of listThreads(root)) {
    const s = thread.status as ThreadStatus;
    if (s in threads) threads[s]++;
  }
  const inInbox = intake.filter((n) => folderOf(n) === "inbox" && !n.meta.outcome).length;
  const next = stages.find((s) => s.state !== "done" && s.state !== "skipped");
  return {
    stages,
    next,
    current: next && { n: next.n, name: next.name },
    openThreads: threads.open,
    lastQuestion: lastQuestion(root),
    threads,
    openLoops: { captured: intake.length, inInbox, sorted: intake.length - inInbox },
  };
}

export function intakeStatusMarkdown(s: IntakeStatus): string {
  const label = (x: StageStatus) =>
    x.state === "done" ? `done ${x.doneAt}` : x.state === "started" && x.sessions ? `started, ${x.sessions} session${x.sessions === 1 ? "" : "s"}` : x.state;
  const rows = s.stages.map((x) => `| ${x.n} | ${x.name} | ${label(x)} | ${x.privacy ?? ""} |`);
  return [
    "# Intake status",
    "",
    "| Stage | Name | State | Privacy |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    `**Next:** ${s.next ? `stage ${s.next.n}, ${s.next.name}` : "all stages done or skipped"}`,
    "",
    `**Threads:** ${s.threads.open} open, ${s.threads.talked} talked, ${s.threads.parked} parked, ${s.threads.closed} closed.`,
    "",
    `**To-dos:** ${s.openLoops.captured} captured, ${s.openLoops.sorted} sorted, ${s.openLoops.inInbox} waiting in the inbox.`,
  ].join("\n");
}
