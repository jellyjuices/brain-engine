import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyTriage, capture } from "../src/capture/actions.ts";
import { addLoop, allLoops, completeLoop } from "../src/todos/todos.ts";
import { appendToSection, fieldsOf, formatTodoLine, nextDue, parseEvery, parseTodoLine } from "../shared/line/index.ts";

const fieldsFor = (line: string) => fieldsOf(parseTodoLine(line)!);
import { absorb, newSubject, planAbsorb, suggestTarget } from "../src/todos/absorb.ts";
import { dump } from "../src/core/notes.ts";
import { loadAll, readNote } from "../src/core/files.ts";
import { areaBrief, check, todayReport, untriaged } from "../src/reports/reports.ts";
import { makeBrain as fixture } from "./fixture.ts";

afterEach(() => delete process.env.BRAIN_TODAY);

const sorted = (root: string, text: string, d: { outcome: "today" | "date" | "someday" | "keep"; area?: string; due?: string }) => {
  const c = capture(root, { text });
  applyTriage(root, c.path, { ...d, keepCapture: true });
  return c.path;
};

test("loop lines parse and format both ways", () => {
  assert.deepEqual(fieldsFor("- [ ] File Toronto expenses · due 2026-11-08"), { text: "File Toronto expenses", done: false, due: "2026-11-08" });
  assert.deepEqual(fieldsFor("- [x] Book a dentist · done 2026-11-10"), { text: "Book a dentist", done: true, doneAt: "2026-11-10" });
  assert.equal(parseTodoLine("- Just a bullet"), null);
});

test("appendToSection adds under the heading, or makes the heading", () => {
  assert.equal(appendToSection("# Goal\n\n# To-dos\n\n- [ ] a\n\n# Notes\n", "# To-dos", "- [ ] b"), "# Goal\n\n# To-dos\n\n- [ ] a\n- [ ] b\n\n# Notes\n");
  assert.equal(appendToSection("# Goal\n", "# Notes", "- x"), "# Goal\n\n# Notes\n\n- x\n");
});

test("capture keeps labels short, and dump writes lists on one line", () => {
  const root = fixture();
  const n = capture(root, { text: "Book a dentist", tags: ["health"] });
  assert.deepEqual(Object.keys(n.meta), ["type", "created", "tags"]);
  assert.match(n.path, /^inbox\/\d{4}-\d{2}-\d{2}-\d{4}-book-a-dentist\.md$/);
  assert.match(readFileSync(join(root, n.path), "utf8"), /^tags: \[health\]$/m);
  assert.equal(dump({ type: "X", generated: { by: "claude", at: "t" } }, "b"), "---\ntype: X\ngenerated: {by: claude, at: t}\n---\n\nb\n");
});

test("absorb files a to-do as an open loop and a fact as a note line, then archives the capture", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  const a = sorted(root, "Chase the pending MRI", { outcome: "today", area: "health" });
  const b = sorted(root, "My GP retires next year", { outcome: "keep", area: "health" });
  const plan = planAbsorb(root);
  assert.deepEqual(plan.map((x) => `${x.capture === a ? "a" : "b"} ${x.into} ${x.as}`).sort(), ["a areas/health.md loop", "b areas/health.md note"]);
  absorb(root, a, "areas/health.md");
  absorb(root, b, "areas/health.md");
  delete process.env.BRAIN_TODAY;
  const body = readNote(root, "areas/health.md").body;
  assert.match(body, /# To-dos\n\n- \[ \] Chase the pending MRI · due 2026-11-04\n/);
  assert.match(body, /# Notes\n\n- \d{4}-\d{2}-\d{2} · My GP retires next year\n/);
  assert.equal(loadAll(root).filter((n) => n.path.startsWith("inbox/")).length, 0);
  assert.equal(loadAll(root).filter((n) => n.meta.absorbed_into === "areas/health.md").length, 2);
  assert.deepEqual(check(root).filter((r) => r.issues.some((i) => i.level === "error")), []);
});

test("suggestTarget never picks a person: a matching project, then the area", () => {
  const root = fixture();
  newSubject(root, "Person", "Maya", "Friend from pottery.", "relationships");
  newSubject(root, "Project", "Move out of my mom's place", "Find my own place.", "money");
  const notes = () => loadAll(root);
  const cap = (text: string, area: string) => readNote(root, sorted(root, text, { outcome: "someday", area }));
  assert.equal(suggestTarget(notes(), cap("Book pottery sessions with Maya", "relationships")).into, "areas/relationships.md");
  assert.equal(suggestTarget(notes(), cap("Budget for my own place and mom's move costs", "money")).into, "projects/move-out-of-my-mom-s-place.md");
  assert.equal(suggestTarget(notes(), cap("Renew the bank card", "money")).into, "areas/money.md");
});

test("open loops show in today and the area brief, and brain done ticks them off", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-04";
  absorb(root, sorted(root, "Family doctor appointment", { outcome: "date", area: "health", due: "2026-11-06" }), "areas/health.md");
  absorb(root, sorted(root, "Chase the pending MRI", { outcome: "today", area: "health" }), "areas/health.md");
  const r = todayReport(root);
  assert.deepEqual(r.dueSoon.map((s) => s.title), ["Chase the pending MRI", "Family doctor appointment"]);
  assert.equal(areaBrief(root, "health").open.length, 2);
  const done = completeLoop(root, "mri");
  assert.equal(done.done, true);
  assert.match(readNote(root, "areas/health.md").body, /- \[x\] Chase the pending MRI · due 2026-11-04 · done 2026-11-04/);
  assert.equal(allLoops(loadAll(root), { done: false }).length, 1);
  assert.throws(() => completeLoop(root, "nothing like this"), /No open to-do/);
  delete process.env.BRAIN_TODAY;
});

test("the inbox count leaves out sorted notes", () => {
  const root = fixture();
  capture(root, { text: "new one" });
  sorted(root, "sorted one", { outcome: "someday", area: "money" });
  assert.equal(untriaged(loadAll(root)).length, 1);
  assert.equal(todayReport(root).inboxCount, 1);
});

test("repeat rules parse, and the next due date steps forward", () => {
  const line = "- [ ] Pay rent · due 2026-12-01 · every month";
  assert.deepEqual(fieldsFor(line), { text: "Pay rent", done: false, due: "2026-12-01", every: "month" });
  assert.equal(formatTodoLine(parseTodoLine(line)!), line);
  assert.equal(parseEvery("every fortnight"), null);
  assert.equal(parseEvery("every 0 days"), null);
  assert.equal(nextDue("2 weeks", "2026-11-05", "2026-11-05"), "2026-11-19");
  assert.equal(nextDue("month", "2027-01-31", "2027-01-31"), "2027-02-28");
  assert.equal(nextDue("year", "2028-02-29", "2028-02-29"), "2029-02-28");
  assert.equal(nextDue("mon", "2026-11-05", "2026-11-05"), "2026-11-09"); // a Thursday
  assert.equal(nextDue("day", "2026-11-01", "2026-11-05"), "2026-11-06"); // skips missed days
  assert.equal(nextDue("weekday", "2026-11-06", "2026-11-06"), "2026-11-09"); // Friday to Monday
  assert.equal(nextDue("month on the 1st", "2026-11-05", "2026-11-05"), "2026-12-01");
  assert.equal(nextDue("month on the 31st", "2027-01-31", "2027-01-31"), "2027-02-28");
  assert.equal(nextDue("month on the 31st", "2027-02-28", "2027-02-28"), "2027-03-31");
  assert.equal(nextDue("week", "2026-10-02", "2026-11-05"), "2026-11-06"); // keeps the Friday rhythm
  assert.equal(nextDue("week when done", "2026-10-02", "2026-11-05"), "2026-11-12"); // counts from today
  assert.equal(parseEvery("every week on the 3rd"), null);
  assert.equal(parseEvery("every month on the 32nd"), null);
  assert.equal(fieldsFor("- [ ] Water plants · due 2026-11-06 · every 3 days when done").every, "3 days when done");
});

test("done on a repeating loop moves its date and makes no copy", () => {
  const root = fixture();
  addLoop(root, "areas/health.md", { text: "Refill meds", due: "2000-01-01", every: "week" });
  const l = completeLoop(root, "refill");
  assert.ok((l.next ?? "") > "2000-01-01", `got ${l.next}`);
  const open = allLoops(loadAll(root), { done: false }).filter((x) => x.text === "Refill meds");
  assert.deepEqual(open.map((x) => [x.due, x.every]), [[l.next, "week"]]);
  assert.equal(allLoops(loadAll(root), { done: true }).filter((x) => x.text === "Refill meds").length, 0);
});

test("old When words and the old heading still read as the new words", () => {
  assert.equal(fieldsFor("- [ ] Chase the MRI · do-now").outcome, "today");
  assert.equal(fieldsFor("- [ ] Hear back · hand-off").outcome, "waiting");
  assert.equal(fieldsFor("- [ ] Learn Japanese · park").outcome, "someday");
  assert.deepEqual(fieldsFor("- [ ] File expenses · due 2026-11-08 · schedule"), { text: "File expenses", done: false, due: "2026-11-08" });
});
