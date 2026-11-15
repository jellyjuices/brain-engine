import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, today } from "../src/core/notes.ts";
import { loadAll } from "../src/core/files.ts";
import { dayList } from "../src/todos/day-list.ts";
import { undo } from "../src/todos/undo.ts";
import { parseWhen } from "../src/todos/when-words.ts";
import { addedLine, comingUp, headerCounts, headerLine, HELP_LINES, INTAKE_OPTIONS, listOptions, MORE_OPTIONS, shortDate, todoActionOptions, todoLabel, undoHead, undoLabel, undoPreview } from "../src/interface/ui-view.ts";
import { smartAdd } from "../src/capture/file.ts";
import { BIN, makeBrain } from "./fixture.ts";

const now = today();
const old = addDays(now, -3);
const later = addDays(now, 5);

function brain(): string {
  const root = makeBrain();
  writeFileSync(join(root, "projects/visit.md"), `---\ntype: Project\ntitle: Visit\ndescription: A visit.\n---\n\n# To-dos\n\n- [ ] Old one · due ${old}\n- [ ] Now one · due ${now} · today\n- [ ] Later one · due ${later}\n- [ ] Ask back · waiting\n- [ ] Maybe · someday\n- [ ] Plain\n- [x] Finished · done ${now}\n- [x] Gone · done ${now} · dropped\n`);
  writeFileSync(join(root, "people/omar.md"), `---\ntype: Person\ntitle: Omar\ndescription: A friend.\n---\n\n# To-dos\n\n- [ ] Call Omar · due ${now} · today\n`);
  writeFileSync(join(root, "inbox/2026-11-05-0900-x.md"), `---\ntype: Capture\ncreated: ${now}T09:00\n---\n\nSomething loose\n`);
  return root;
}

test("header: date and done today", () => {
  const root = brain();
  assert.deepEqual(headerCounts(root), { inbox: 1, overdue: 1, today: 2, doneToday: 1 });
  assert.equal(headerLine(headerCounts(root), "2026-11-05"), "brain · Thu Nov 5 · 1 done today");
  assert.equal(shortDate("2026-11-20"), "Fri Nov 20");
});

test("list: sections in order, empty sections hidden, labels carry the subject", () => {
  const root = brain();
  const items = dayList(root, { save: false });
  const o = listOptions(items, { inbox: 0 });
  const heads = o.filter((x) => x.disabled && x.value.startsWith("h:") && !["h:rule", "h:none"].includes(x.value)).map((x) => x.label);
  assert.deepEqual(heads, ["Overdue", "Today", "Waiting on someone"]);
  assert.deepEqual(["Old one · Visit"].filter((v) => !o.map((x) => x.label).includes(v)), []);
  const none = listOptions(items.filter((x) => x.group === "today"), { inbox: 0 });
  assert.deepEqual(none.filter((x) => x.disabled && x.value.startsWith("h:") && x.value !== "h:rule").map((x) => x.label), ["Today"]);
  assert.equal(listOptions([], { inbox: 0 })[0].label, "Nothing for today.");
});

test("list: Sort only with inbox items, Undo only after a change, 5 extras at most", () => {
  const items = dayList(brain(), { save: false });
  const extras = (o: ReturnType<typeof listOptions>) => o.slice(o.findIndex((x) => x.value === "h:rule") + 1).map((x) => x.label);
  assert.deepEqual(extras(listOptions(items, { inbox: 0 })), ["+ Add", "Find", "More"]);
  assert.deepEqual(extras(listOptions(items, { inbox: 2 }, 'Done "Gym…"')), ["+ Add", "Find", "Sort inbox (2)", 'Undo: Done "Gym…"', "More"]);
  const count = extras(listOptions(items, { inbox: 9 }, "x")).length;
  assert.ok(count <= 5, `got ${count}`);
});

test("labels are cut to the width and keep the subject", () => {
  const l = todoLabel("Ask the client for half of December off and then some more words", "Client work", 40);
  assert.ok(l.length <= 40, `got ${l.length}`);
  assert.equal(l.slice(-" · Client work".length), " · Client work");
  assert.equal(todoLabel("Short", "Fitness", 40), "Short · Fitness");
  for (const x of listOptions(dayList(brain(), { save: false }), { inbox: 1 }, "Done thing", 20)) assert.ok(x.label.length <= 20, x.label);
});

test("a to-do offers 5 verbs and its subject; More and Intake are short", () => {
  assert.deepEqual(todoActionOptions("Fitness").map((x) => x.label), ["Done", "Tomorrow", "Pick a day", "Someday", "Delete", "Open Fitness"]);
  assert.equal(todoActionOptions().length, 5);
  assert.deepEqual(MORE_OPTIONS.map((x) => x.label), ["Weekly review", "Intake", "Coming up", "Help"]);
  assert.deepEqual(INTAKE_OPTIONS.map((x) => x.label), ["What to talk about next", "Brain dump", "Open questions"]);
});

test("screens use only the owner's words", () => {
  const banned = /absorb|triage|loop|outcome|do-now|schedule|hand-off|park/i;
  const labels = [...listOptions([], { inbox: 1 }, 'Done "x"'), ...todoActionOptions("Visit"), ...MORE_OPTIONS, ...INTAKE_OPTIONS].map((x) => x.label).concat(HELP_LINES);
  for (const l of labels) assert.doesNotMatch(l, banned, l);
  assert.deepEqual(labels.filter((l) => l === "Back"), []);
});

test("undo: head, short label, and smart add is undoable", () => {
  const root = brain();
  assert.equal(undoPreview(root), undefined);
  const r = smartAdd(root, loadAll(root), "note: Omar is back from the trip");
  assert.equal(r.filed, true);
  assert.match(undoPreview(root)!, /added to people\/omar.md/);
  assert.match(undoHead(root)!.id ?? "", /\S/);
  undo(root);
  assert.equal(undoPreview(root), undefined);
  assert.equal(undoLabel("done: Make a gym schedule today (areas/fitness.md)"), 'Done "Make a gym sc…"');
});

test("added line says where and when", () => {
  assert.equal(addedLine("Family doctor", { kind: "date", due: "2026-11-06" }, "2026-11-05"), "Added to Family doctor, for tomorrow.");
  assert.equal(addedLine("Family doctor", { kind: "note" }), "Added to Family doctor as a note.");
});

test("Pick a day takes a weekday, nov 20 or a date", () => {
  assert.equal(parseWhen("nov 20", "2026-11-05").due, "2026-11-20");
  assert.equal(parseWhen("Jan 3", "2026-11-05").due, "2027-01-03");
  assert.equal(parseWhen("2026-11-20").due, "2026-11-20");
  assert.throws(() => parseWhen("feb 31", "2026-11-05"));
  assert.match(parseWhen("fri").due ?? "", /\S/);
});

test("coming up lists the next 14 days only", () => {
  const rows = comingUp(loadAll(brain()), now);
  assert.equal(rows.length, 1);
  assert.match(rows[0], /Later one · Visit/);
});

test("bare brain keeps the numbered list when piped, and --json gives JSON", () => {
  const root = brain();
  const env = { ...process.env, BRAIN_HOME: root, NO_COLOR: "1" };
  const args = ["--disable-warning=ExperimentalWarning", BIN];
  const bare = spawnSync(process.execPath, args, { encoding: "utf8", env, input: "" });
  assert.match(bare.stdout, /Overdue\n\s+1\. Old one/);
  const j = spawnSync(process.execPath, [...args, "--json"], { encoding: "utf8", env });
  assert.equal(Array.isArray(JSON.parse(j.stdout)), true);
  const m = spawnSync(process.execPath, [...args, "menu"], { encoding: "utf8", env, input: "" });
  assert.match(m.stdout, /Overdue/);
});
