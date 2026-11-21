import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { newNote } from "../src/capture/actions.ts";
import { loadAll, readNote } from "../src/core/files.ts";
import { allLoops } from "../src/todos/todos.ts";
import { areaBrief, check, todayReport } from "../src/reports/reports.ts";
import { makeBrain as fixture } from "./fixture.ts";

afterEach(() => delete process.env.BRAIN_TODAY);

const event = (title: string, extra: string) =>
  `---\ntype: Event\ntitle: ${title}\ndescription: About ${title}.\narea: health\n${extra}---\n\n# Prep\n\n# To-dos\n\n- [ ] Ask about ${title} · today\n`;

test("brain new Event uses the template, lands in events/ and passes check", () => {
  const root = fixture();
  const n = newNote(root, "Event", "Dentist cleaning", { description: "Six-month cleaning.", date: "2026-12-15", area: "health" });
  assert.equal(n.path, "events/dentist-cleaning.md");
  assert.equal(readNote(root, n.path).meta.status, "upcoming");
  assert.match(n.body, /# Prep/);
  assert.deepEqual(check(root).filter((r) => r.path === n.path).flatMap((r) => r.issues).filter((i) => i.level === "error"), []);
});

test("check flags an Event with no date, a bad date or a bad status", () => {
  const root = fixture();
  writeFileSync(join(root, "events/a.md"), event("No date", ""));
  writeFileSync(join(root, "events/b.md"), event("Bad date", "date: soon\n"));
  writeFileSync(join(root, "events/c.md"), event("Bad status", "date: 2026-11-06\nstatus: stable\n"));
  const msgs = (p: string) => check(root).find((r) => r.path === p)?.issues.map((i) => i.message).join(" | ") ?? "";
  assert.match(msgs("events/a.md"), /missing `date`/);
  assert.match(msgs("events/b.md"), /`date` is not a date/);
  assert.match(msgs("events/c.md"), /unknown status `stable`/);
});

test("today lists an upcoming event on its date, and drops it once done", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-05";
  writeFileSync(join(root, "events/soon.md"), event("Family doctor", "date: 2026-11-06\nstatus: upcoming\n"));
  writeFileSync(join(root, "events/past.md"), event("Missed", "date: 2026-11-01\nstatus: upcoming\n"));
  writeFileSync(join(root, "events/done.md"), event("Old visit", "date: 2026-11-02\nstatus: done\n"));
  const r = todayReport(root);
  delete process.env.BRAIN_TODAY;
  assert.deepEqual(r.dueSoon.filter((s) => s.type === "Event").map((s) => s.title), ["Family doctor"]);
  assert.deepEqual(r.overdue.filter((s) => s.type === "Event").map((s) => s.title), ["Missed"]);
  const events = [...r.overdue, ...r.dueSoon].filter((s) => s.type === "Event").map((s) => s.title);
  assert.deepEqual(events.filter((w) => w === "Old visit"), [], "a done event is not listed");
  assert.deepEqual([...r.overdue, ...r.dueSoon].filter((s) => s.title === "Ask about Old visit"), [], "an old today mark is not due");
});

test("loops inside an event count as open loops, with the event's area", () => {
  const root = fixture();
  writeFileSync(join(root, "events/soon.md"), event("Family doctor", "date: 2026-11-06\n"));
  const loops = allLoops(loadAll(root), { done: false });
  assert.deepEqual(loops.map((l) => [l.text, l.area]), [["Ask about Family doctor", "health"]]);
});

test("area brief lists upcoming events in that area", () => {
  const root = fixture();
  writeFileSync(join(root, "events/soon.md"), event("Family doctor", "date: 2026-11-06\n"));
  const b = areaBrief(root, "health");
  assert.deepEqual(b.open.filter((s) => s.type === "Event").map((s) => s.due), ["2026-11-06"]);
});

test("loops inside an upcoming event fold into the event as bullets", () => {
  const root = fixture();
  process.env.BRAIN_TODAY = "2026-11-05";
  writeFileSync(join(root, "events/soon.md"), event("Family doctor", "date: 2026-11-06\nstatus: upcoming\n"));
  const r = todayReport(root);
  delete process.env.BRAIN_TODAY;
  const all = [...r.overdue, ...r.dueSoon];
  assert.deepEqual(all.filter((s) => s.type === "Loop" && s.path === "events/soon.md"), [], "no separate loop items");
  assert.deepEqual(r.dueSoon.find((s) => s.title === "Family doctor")?.subitems, ["Ask about Family doctor"]);
});
