import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { addDays, today } from "../src/core/notes.ts";
import { dayList } from "../src/todos/day-list.ts";
import { undo } from "../src/todos/undo.ts";
import { applyOverdue, askedToday, markAsked } from "../src/todos/overdue.ts";
import { BIN, makeBrain } from "./fixture.ts";

const now = today();
const old = addDays(now, -3);

function brainOverdue(): string {
  const root = makeBrain();
  writeFileSync(join(root, "projects/visit.md"), `---\ntype: Project\ntitle: Visit\ndescription: A visit.\n---\n\n# To-dos\n\n- [ ] One · due ${old}\n- [ ] Two · due ${old}\n- [ ] Three · due ${old}\n- [ ] Fine · due ${now} · today\n`);
  return root;
}
const file = (root: string) => readFileSync(join(root, "projects/visit.md"), "utf8");
const groups = (root: string) => dayList(root).map((x) => `${x.group}:${x.text}`);

test("move all to today is one change, and one undo reverses all", () => {
  const root = brainOverdue();
  const before = file(root);
  const r = applyOverdue(root, now, "all");
  assert.equal(r.changed, 3);
  assert.deepEqual(groups(root).filter((g) => g.startsWith("overdue")), []);
  assert.equal(file(root).split("due " + now).length - 1, 4);
  undo(root);
  assert.equal(file(root), before);
  assert.throws(() => undo(root), /Nothing to undo/);
});

test("someday moves all overdue to someday, one undo", () => {
  const root = brainOverdue();
  const before = file(root);
  assert.equal(applyOverdue(root, now, "someday").changed, 3);
  assert.match(file(root), /- \[ \] One · someday/);
  assert.deepEqual(groups(root), ["today:Fine"]);
  undo(root);
  assert.equal(file(root), before);
});

test("pick applies each action to its own to-do", () => {
  const root = brainOverdue();
  const r = applyOverdue(root, now, { pick: { 1: "done", 2: "2026-12-01", 3: "leave" } });
  assert.equal(r.changed, 2);
  assert.match(file(root), /- \[x\] One/);
  assert.match(file(root), /- \[ \] Two · due 2026-12-01/);
  assert.match(file(root), new RegExp(`- \\[ \\] Three · due ${old}`));
});

test("pick can move to today, someday or drop", () => {
  const root = brainOverdue();
  applyOverdue(root, now, { pick: { 1: "today", 2: "someday", 3: "drop" } });
  const f = file(root);
  assert.match(f, new RegExp(`- \\[ \\] One · due ${now}`));
  assert.match(f, /- \[ \] Two · someday/);
  assert.match(f, /- \[x\] Three/);
});

test("leave changes nothing", () => {
  const root = brainOverdue();
  const before = file(root);
  const r = applyOverdue(root, now, "leave");
  assert.equal(r.changed, 0);
  assert.equal(file(root), before);
});

test("asked once a day", () => {
  const root = brainOverdue();
  assert.equal(askedToday(root, now), false);
  markAsked(root, now);
  assert.equal(askedToday(root, now), true);
  assert.equal(askedToday(root, addDays(now, 1)), false);
});

test("brain --json and brain without a terminal never ask", () => {
  const root = brainOverdue();
  const env = { ...process.env, BRAIN_HOME: root };
  for (const args of [["list-today", "--json"], []]) {
    const r = spawnSync("node", [BIN, ...args], { env, encoding: "utf8", input: "" });
    assert.equal(r.status, 0, r.stderr);
    assert.doesNotMatch(r.stdout, /overdue: move all/);
  }
  assert.equal(askedToday(root, now), false);
});
