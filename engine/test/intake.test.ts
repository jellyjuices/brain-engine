import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { brainDump } from "../src/capture/actions.ts";
import { findStage, markStageDone, readSettings, setLensPrivacy } from "../src/intake/lenses.ts";
import { redact, saveLensAnswer } from "../src/intake/lens-answers.ts";
import { addThread, listThreads, nextThread, updateThread } from "../src/intake/threads.ts";
import { intakeStatus } from "../src/intake/intake-status.ts";
import { check } from "../src/reports/reports.ts";
import { BIN, makeBrain } from "./fixture.ts";

afterEach(() => delete process.env.BRAIN_TODAY);

function fixture(): string {
  const root = makeBrain();
  mkdirSync(join(root, "me"), { recursive: true });
  writeFileSync(join(root, "me", "settings.yaml"), 'called: ""\npronouns: ""\nown_words: []\nstop_word: pause\nstages_done: {}\n');
  return root;
}

const issues = (root: string, path: string) => check(root).find((r) => r.path === path)?.issues.map((i) => i.message) ?? [];

test("a fresh brain passes brain check and has no lens notes yet", () => {
  const root = fixture();
  assert.deepEqual(check(root), []);
  assert.equal(existsSync(join(root, "me", "now.md")), false);
  assert.equal(readSettings(root).stop_word, "pause");
});

test("a lens note is made on first save, with its stage, privacy and boundary", () => {
  const root = fixture();
  const n = saveLensAnswer(root, "wellbeing", "Sleep is ok.");
  assert.equal(n.path, "me/wellbeing.md");
  assert.equal(n.meta.stage, 7);
  assert.equal(n.meta.privacy, "headline");
  assert.match(n.body, /Boundary: How I feel and cope/);
  assert.match(n.body, /- Sleep is ok\./);
  assert.deepEqual(check(root), []);
});

test("context answers go to the now lens, and stage done writes settings.yaml", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  saveLensAnswer(root, findStage("context")!.lenses[0], "Contracting, renting in the west end.");
  markStageDone(root, "context");
  delete process.env.BRAIN_TODAY;
  assert.match(readFileSync(join(root, "me", "now.md"), "utf8"), /Contracting/);
  assert.deepEqual(readSettings(root).stages_done, { context: "2026-11-04" });
  assert.match(readFileSync(join(root, "me", "settings.yaml"), "utf8"), /^# Intake settings/);
});

test("thread add saves a line in the lens note, made on first use", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  const t = addThread(root, { question: "What made weeks feel lighter in the past?", lens: "wellbeing" });
  delete process.env.BRAIN_TODAY;
  assert.equal(t.path, "me/wellbeing.md");
  assert.equal(t.status, "open");
  assert.equal(t.depth, 1);
  const body = readFileSync(join(root, "me", "wellbeing.md"), "utf8");
  assert.match(body, /# Open threads\n\n- \[ \] What made weeks feel lighter in the past\? · 2026-11-04\n/);
  assert.equal(addThread(root, { question: "What made weeks feel lighter in the past?", lens: "wellbeing" }).question, t.question, "a repeat question is not added twice");
  assert.equal(listThreads(root).length, 1);
  assert.equal(existsSync(join(root, "threads")), false, "no thread files");
  assert.deepEqual(check(root), []);
});
test("thread add refuses an unknown lens and a skipped lens", () => {
  const root = fixture();
  assert.throws(() => addThread(root, { question: "Q?", lens: "weather" }), /unknown lens/);
  setLensPrivacy(root, "story", "skip");
  assert.throws(() => addThread(root, { question: "Q?", lens: "story" }), /skip/);
});

test("thread next picks starred, then shallowest, then oldest", () => {
  const root = fixture();
  addThread(root, { question: "Deep one?", lens: "now", depth: 3 });
  addThread(root, { question: "Shallow one?", lens: "now", depth: 1 });
  assert.equal(nextThread(root)?.question, "Shallow one?");
  addThread(root, { question: "Starred one?", lens: "people", depth: 2, star: true });
  assert.equal(nextThread(root)?.question, "Starred one?");
  assert.equal(nextThread(root, { lens: "now" })?.question, "Shallow one?");
});
test("thread set changes status and star, and rejects a bad status", () => {
  const root = fixture();
  addThread(root, { question: "Who do you talk to after a hard call?", lens: "people" });
  const t = updateThread(root, "hard call", { status: "talked", star: true });
  assert.equal(t.status, "talked");
  assert.equal(t.starred, true);
  assert.match(readFileSync(join(root, "me", "people.md"), "utf8"), /- \[x\] Who do you talk to after a hard call\? · ★ · talked/);
  assert.equal(listThreads(root, { status: "open" }).length, 0);
  updateThread(root, "hard call", { status: "parked" });
  assert.match(readFileSync(join(root, "me", "people.md"), "utf8"), /- \[ \] Who do you talk to after a hard call\? · ★ · parked/);
  assert.throws(() => updateThread(root, "hard call", { status: "done" }), /status must be/);
});
test("intake save adds answers under one dated heading per session", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  saveLensAnswer(root, "now", "Client work takes the most room.", { session: 1 });
  saveLensAnswer(root, "now", "Money is a 6.", { session: 1 });
  saveLensAnswer(root, "now", "Home is a 4.", { session: 2 });
  delete process.env.BRAIN_TODAY;
  const body = readFileSync(join(root, "me", "now.md"), "utf8");
  assert.equal(body.match(/^## 2026-11-04 session 1$/gm)?.length, 1);
  assert.match(body, /session 1\n\n- Client work takes the most room\.\n- Money is a 6\./);
  assert.match(body, /## 2026-11-04 session 2\n\n- Home is a 4\./);
  assert.deepEqual(check(root), []);
});

test("intake save refuses a lens set to skip", () => {
  const root = fixture();
  setLensPrivacy(root, "identity", "skip");
  assert.throws(() => saveLensAnswer(root, "identity", "Anything."), /skip/);
});

test("check warns when a headline lens holds long answers, and errors on bad labels", () => {
  const root = fixture();
  saveLensAnswer(root, "wellbeing", "x".repeat(200));
  assert.match(issues(root, "me/wellbeing.md").join("\n"), /set to headline/);
  writeFileSync(join(root, "me", "bad.md"), "---\ntype: Lens\ntitle: Bad\ndescription: Bad.\nlens: weather\nprivacy: secret\nstatus: done\n---\n\nx\n");
  const bad = issues(root, "me/bad.md");
  assert.match(bad.join("\n"), /unknown lens/);
  assert.match(bad.join("\n"), /unknown privacy/);
  assert.match(bad.join("\n"), /unknown status/);
});

test("intake status follows stages, threads and open loops", () => {
  const root = fixture();
  let s = intakeStatus(root);
  assert.equal(s.next?.n, 0);
  assert.equal(s.stages.find((x) => x.key === "body-and-mind")?.privacy, "headline");
  markStageDone(root, "0");
  brainDump(root, "Chase the March invoice\nBook a dentist visit");
  saveLensAnswer(root, "day", "Woke up at 7.");
  addThread(root, { question: "What would a lighter week look like?", lens: "day" });
  setLensPrivacy(root, "future", "skip");
  s = intakeStatus(root);
  assert.equal(s.stages[0].state, "done");
  assert.equal(s.stages[1].state, "started");
  assert.equal(s.stages[3].state, "started");
  assert.equal(s.stages[3].sessions, 1);
  assert.equal(s.stages.find((x) => x.key === "future")?.state, "skipped");
  assert.equal(s.next?.n, 1);
  assert.equal(s.threads.open, 1);
  assert.deepEqual(s.openLoops, { captured: 2, inInbox: 2, sorted: 0 });
  assert.throws(() => markStageDone(root, "99"), /unknown stage/);
});

test("the brain command runs thread and intake subcommands", () => {
  const root = fixture();
  const run = (...args: string[]) => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, ...args], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });
  let r = run("thread", "add", "What does a good Sunday look like?", "--lens", "day", "--depth", "2");
  assert.equal(r.status, 0, r.stderr);
  r = run("thread", "next", "--json");
  assert.equal(JSON.parse(r.stdout).depth, 2);
  r = run("intake", "save", "day", "Sample text, then more text.");
  assert.equal(r.status, 0, r.stderr);
  r = run("intake", "done", "day");
  assert.equal(r.status, 0, r.stderr);
  r = run("intake", "status", "--json");
  assert.equal(JSON.parse(r.stdout).stages[3].state, "done");
  r = run("check");
  assert.equal(r.status, 0, r.stdout);
});

test("save keeps the distilled line in the lens and the full answer in sources/intake/", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  const n = saveLensAnswer(root, "now", "Client work takes the most room.", {
    session: 2,
    quote: "it sits on my chest all week",
    raw: "Honestly, client work is the big one. It sits on my chest all week, even on weekends.",
    question: "What takes up the most room in your head?",
  });
  delete process.env.BRAIN_TODAY;
  assert.match(n.body, /- Client work takes the most room\. \(\[raw\]\(\.\.\/sources\/intake\/2026-11-04-session-2\.md\)\)/);
  assert.match(n.body, /  - In their words: "it sits on my chest all week"/);
  assert.doesNotMatch(n.body, /even on weekends/);
  const raw = readFileSync(join(root, "sources", "intake", "2026-11-04-session-2.md"), "utf8");
  assert.match(raw, /^# Intake 2026-11-04 session 2/);
  assert.match(raw, /· now\n\n\*\*Q:\*\* What takes up the most room in your head\?\n\n\*\*A:\*\* Honestly, client work/);
  assert.deepEqual(check(root), []);
});

test("save refuses a quote or raw answer on a headline lens, and a long quote", () => {
  const root = fixture();
  assert.throws(() => saveLensAnswer(root, "wellbeing", "Sleep is ok.", { raw: "Long story." }), /headline/);
  assert.throws(() => saveLensAnswer(root, "wellbeing", "Sleep is ok.", { quote: "ok-ish" }), /headline/);
  assert.throws(() => saveLensAnswer(root, "now", "Busy.", { quote: "x".repeat(130) }), /quote is over/);
});

test("check asks to distill a long answer on a full lens", () => {
  const root = fixture();
  saveLensAnswer(root, "day", "y".repeat(260));
  assert.match(issues(root, "me/day.md").join("\n"), /Distill to one line/);
});

test("redact removes the line, its quote, the raw answer and matching threads", () => {
  const root = fixture();
  saveLensAnswer(root, "now", "The landlord dispute weighs on me.", { quote: "it never ends", raw: "The landlord dispute weighs on me a lot.", question: "What is heavy?" });
  saveLensAnswer(root, "now", "Work is steady.");
  addThread(root, { question: "What would end the landlord dispute?", lens: "now" });
  const r = redact(root, "landlord dispute");
  assert.equal(r.lensLines, 2);
  assert.equal(r.rawAnswers, 1);
  assert.equal(r.threads, 1);
  const body = readFileSync(join(root, "me", "now.md"), "utf8");
  assert.doesNotMatch(body, /landlord|it never ends/);
  assert.match(body, /- Work is steady\./);
  const raws = readdirSync(join(root, "sources", "intake"));
  assert.doesNotMatch(readFileSync(join(root, "sources", "intake", raws[0]), "utf8"), /landlord/);
  assert.deepEqual(check(root), []);
  assert.throws(() => redact(root, "ab"), /at least 3/);
});


import { intakePrompts } from "../src/intake/subjects.ts";
import { saveSubject } from "../src/intake/subject-save.ts";
import { fileIntakeTodo } from "../src/intake/intake-todo.ts";
import { endSummary, linkKnownNames } from "../src/intake/intake-end.ts";
import { loadAll } from "../src/core/files.ts";
import { readLog } from "../src/core/log.ts";
import { undo } from "../src/todos/undo.ts";

const subjectNote = (root: string, rel: string, type: string, title: string, extra = "") =>
  writeFileSync(join(root, rel), `---\ntype: ${type}\ntitle: ${title}\ndescription: Test note.\n---\n\n# To-dos\n\n# Notes\n${extra}`);

test("an unknown name gets one question per session, and a role is never guessed", () => {
  const root = fixture();
  subjectNote(root, "projects/acme.md", "Project", "Acme");
  const first = intakePrompts(root, "I started a thing with Omar at Acme.");
  assert.equal(first.ask?.question, "Who is Omar to you?");
  assert.equal(intakePrompts(root, "Omar called again.").ask, undefined);
  assert.equal(saveSubject(root, { name: "Omar" }).skipped, true);
  assert.equal(existsSync(join(root, "people", "omar.md")), false);
});

test("a fixture intake session makes a relation and nothing lands in inbox", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-05";
  subjectNote(root, "projects/acme.md", "Project", "Acme");
  assert.equal(intakePrompts(root, "My co-founder Omar runs Acme with me.").ask?.name, "Omar");
  const r = saveSubject(root, { name: "Omar", type: "person", role: "co-founder", about: "acme", fact: "Started Acme with me in 2025." });
  assert.equal(r.path, "people/omar.md");
  const omar = readFileSync(join(root, "people", "omar.md"), "utf8");
  assert.match(omar, /- \[Acme\]\(\.\.\/projects\/acme\.md\) · co-founder/);
  assert.match(omar, /- 2026-11-05 · Started Acme with me in 2025\./);
  assert.match(omar, /generated:/);
  const lens = saveLensAnswer(root, "people", "Omar is my co-founder. Omar and I talk daily.");
  assert.match(lens.body, /- \[Omar\]\(\.\.\/people\/omar\.md\) is my co-founder\. Omar and I talk daily\./);
  const t = fileIntakeTodo(root, "Send Omar the contract", { when: "tomorrow", about: "acme" });
  assert.equal(t.into, "projects/acme.md");
  assert.match(readFileSync(join(root, "projects", "acme.md"), "utf8"), /- \[ \] Send Omar the contract · with \[Omar\]\(\.\.\/people\/omar\.md\) · due 2026-11-06/);
  assert.throws(() => fileIntakeTodo(root, "Something", { about: "acme" }), /When\?/);
  assert.throws(() => fileIntakeTodo(root, "Something vague", { when: "today" }), /About what\?/);
  assert.deepEqual(readdirSync(join(root, "inbox")), []);
  assert.deepEqual(check(root).filter((x) => x.issues.some((i) => i.level === "error")), []);
  const end = endSummary(root);
  assert.equal(end.text[0], "New: Omar (person), Omar · co-founder of Acme.");
  assert.match(end.text.join("\n"), /use undo/);
  assert.equal(endSummary(root).text[0], "No new subjects, facts or to-dos this session.");
  const undoable = readLog(root).filter((e) => e.undo).length;
  assert.ok(undoable >= 3, `got ${undoable}`);
  undo(root);
  assert.doesNotMatch(readFileSync(join(root, "projects", "acme.md"), "utf8"), /Send Omar/);
});

test("a name that came up before is offered a note, once", () => {
  const root = fixture();
  subjectNote(root, "projects/one.md", "Project", "One", "\n- 2026-11-01 · Lunch with Priya soon.\n");
  const p = intakePrompts(root, "Ask Priya about it.");
  assert.equal(p.ask, undefined);
  assert.deepEqual(p.offers.map((o) => o.prompt), ["Priya came up again. Make a note?"]);
  assert.deepEqual(intakePrompts(root, "Ask Priya later").offers, []);
});

test("linkKnownNames leaves existing links and areas alone", () => {
  const root = fixture();
  subjectNote(root, "people/omar.md", "Person", "Omar");
  const notes = loadAll(root);
  assert.equal(linkKnownNames(notes, "[Omar](../people/omar.md) and Omar", "me/people.md"), "[Omar](../people/omar.md) and Omar");
  assert.equal(linkKnownNames(notes, "Money is tight.", "me/now.md"), "Money is tight.");
});
