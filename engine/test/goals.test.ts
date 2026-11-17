import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readNote } from "../src/core/files.ts";
import { areasOf, summary } from "../src/core/notes.ts";
import { relationsIn } from "../src/core/relations.ts";
import { relationsOf } from "../src/core/index-links.ts";
import { check } from "../src/reports/reports.ts";
import { BIN, makeBrain } from "./fixture.ts";

const GOAL_BODY = "# Why\n\n# Targets\n\n- [ ] Run 5 km\n\n# Wins\n\n# Notes\n";
const DECISION_BODY = "# Rants\n\n# Buckets\n\n# Options\n\n# Decided\n";

function write(root: string, rel: string, front: string, body: string) {
  writeFileSync(join(root, rel), `---\n${front}\n---\n\n${body}`);
}

function goal(root: string, slug: string, extra = "areas: [fitness]", status = "active") {
  write(root, `goals/${slug}.md`, `type: Goal\ntitle: Goal ${slug}\ndescription: A sample goal.\nstatus: ${status}\n${extra}`, GOAL_BODY);
}

function messages(root: string, path: string): string {
  return check(root).find((r) => r.path === path)?.issues.map((i) => i.message).join(" | ") ?? "";
}

test("a Goal and a Decision with good fields pass check", () => {
  const root = makeBrain();
  goal(root, "run-far");
  write(root, "decisions/move-city.md", "type: Decision\ntitle: Move to a new city?\ndescription: A sample choice.\nstatus: open\ndecide_by: 2027-01-31\nsubjects: []\nareas: [home, money]", DECISION_BODY);
  assert.deepEqual(check(root), []);
});

test("Goal and Decision status, dates and sections are checked", () => {
  const root = makeBrain();
  goal(root, "run-far", "areas: [fitness]", "stable");
  write(root, "decisions/pick.md", "type: Decision\ntitle: Pick one?\ndescription: A sample choice.\nstatus: active\ndecide_by: soon\nareas: [home]", "# Rants\n");
  assert.match(messages(root, "goals/run-far.md"), /unknown status `stable`/);
  const decision = messages(root, "decisions/pick.md");
  assert.match(decision, /unknown status `active`/);
  assert.match(decision, /`decide_by` is not a date/);
  assert.match(decision, /missing section `# Options`/);
});

test("areas must list at least 1 area where required", () => {
  const root = makeBrain();
  goal(root, "none", "areas: []");
  goal(root, "missing", "tags: []");
  goal(root, "four", "areas: [home, money, health, career]");
  goal(root, "six", "areas: [home, money, health, career, fitness, general]");
  goal(root, "ghost", "areas: [not-an-area]");
  assert.match(messages(root, "goals/none.md"), /must list at least 1 area/);
  assert.match(messages(root, "goals/missing.md"), /must list at least 1 area/);
  assert.equal(messages(root, "goals/four.md"), "");
  assert.equal(messages(root, "goals/six.md"), "");
  assert.match(messages(root, "goals/ghost.md"), /area `not-an-area` has no note in areas\//);
});

test("areas on other types is checked only when present", () => {
  const root = makeBrain();
  write(root, "topics/plain.md", "type: Topic\ntitle: Plain\ndescription: No areas.", "# Notes\n");
  write(root, "topics/wide.md", "type: Topic\ntitle: Wide\ndescription: Many areas.\nareas: [home, money, health, career]", "# Notes\n");
  assert.equal(messages(root, "topics/plain.md"), "");
  assert.equal(messages(root, "topics/wide.md"), "");
});

test("the old single area still reads, and areas wins when both exist", () => {
  const root = makeBrain();
  goal(root, "old", "area: fitness");
  goal(root, "both", "area: fitness\nareas: [home, money]");
  assert.equal(messages(root, "goals/old.md"), "");
  assert.deepEqual(areasOf(readNote(root, "goals/old.md")), ["fitness"]);
  const both = readNote(root, "goals/both.md");
  assert.deepEqual(areasOf(both), ["home", "money"]);
  assert.equal(summary(both).area, "home");
  assert.equal(summary(readNote(root, "goals/old.md")).area, "fitness");
});

test("a subgoal is fine, a grandchild goal fails", () => {
  const root = makeBrain();
  goal(root, "top");
  goal(root, "child", "areas: [fitness]\nparent: top");
  goal(root, "grandchild", "areas: [fitness]\nparent: \"[Child](child.md)\"");
  goal(root, "orphan", "areas: [fitness]\nparent: nowhere");
  assert.equal(messages(root, "goals/child.md"), "");
  assert.match(messages(root, "goals/grandchild.md"), /is a subgoal itself/);
  assert.match(messages(root, "goals/orphan.md"), /`parent` goal `nowhere` has no note/);
});

test("relation sections on goals and decisions parse into the index", () => {
  const root = makeBrain();
  write(root, "people/sam.md", "type: Person\ntitle: Sam\ndescription: A sample person.", "# Notes\n");
  write(root, "goals/run-far.md", "type: Goal\ntitle: Run far\ndescription: A sample goal.\nstatus: active\nareas: [fitness]", `${GOAL_BODY}\n# People\n\n- [Sam](../people/sam.md) · coach\n`);
  write(root, "decisions/race.md", "type: Decision\ntitle: Enter the race?\ndescription: A sample choice.\nstatus: open\nareas: [fitness]", `${DECISION_BODY}\n# Goals\n\n- [Run far](../goals/run-far.md)\n`);
  assert.deepEqual(relationsIn(readNote(root, "goals/run-far.md")).map((r) => [r.to, r.heading, r.role]), [["people/sam.md", "People", "coach"]]);
  const rels = relationsOf(root, "goals/run-far.md");
  assert.deepEqual(rels.out.map((r) => r.to), ["people/sam.md"]);
  assert.deepEqual(rels.in.map((r) => [r.from, r.heading]), [["decisions/race.md", "Goals"]]);
});

test("brain new Goal and brain new Decision make valid notes", () => {
  const root = makeBrain();
  const run = (...args: string[]) => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, ...args], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });
  assert.equal(run("new", "Goal", "Run a marathon", "-d", "A sample goal.", "--area", "fitness").status, 0);
  assert.equal(run("new", "decision", "Buy a bike?", "-d", "A sample choice.").status, 0);
  const g = readNote(root, "goals/run-a-marathon.md");
  assert.deepEqual([g.meta.type, g.meta.status, g.meta.areas, g.meta.area], ["Goal", "active", ["fitness"], undefined]);
  assert.match(readFileSync(join(root, "decisions/buy-a-bike.md"), "utf8"), /# Rants[\s\S]*# Decided/);
  assert.deepEqual(check(root), []);
});
