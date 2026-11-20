import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadAll } from "../src/core/files.ts";
import { addDays, today } from "../src/core/notes.ts";
import { decisionView } from "../src/reports/decisions.ts";
import { goalList, goalView } from "../src/reports/goals.ts";
import { dayList } from "../src/todos/day-list.ts";
import { startApi } from "./api-helpers.ts";
import { makeBrain } from "./fixture.ts";

const now = today();
const tomorrow = addDays(now, 1);
const RUN = "goals/run-far.md";
const WARM = "goals/warm-up.md";

function put(root: string, rel: string, front: string, body: string) {
  writeFileSync(join(root, rel), `---\n${front}\n---\n\n${body}`);
}

function goal(root: string, slug: string, targets: string, extra = "") {
  put(root, `goals/${slug}.md`, `type: Goal\ntitle: Goal ${slug}\ndescription: A sample goal.\nwhy: Because.\nstatus: active\nareas: [health]${extra}`, `# Why\n\n# Targets\n\n${targets}\n\n# Wins\n\n# Notes\n`);
}

function decision(root: string, slug: string, status: string, by: string, goalLink = `- [Goal run-far](../goals/run-far.md)`) {
  put(root, `decisions/${slug}.md`, `type: Decision\ntitle: Pick ${slug}?\ndescription: A sample choice.\nstatus: ${status}\ndecide_by: ${by}\nsubjects: []\nareas: [health]`, `# Rants\n\n# Buckets\n\n# Options\n\n# Decided\n\nWe chose the second.\n\n# Goals\n\n${goalLink}\n`);
}

function todos(root: string, lines: string[]) {
  put(root, "projects/plan.md", "type: Project\ntitle: Plan\ndescription: A sample project.", `# To-dos\n\n${lines.join("\n")}\n\n# Notes\n`);
}

const percent = (root: string, path = RUN) => goalView(loadAll(root), path)!.percent;

test("percent is 0 with nothing, partial with some, 100 with all done; computed on read", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  assert.equal(percent(root), 0);
  goal(root, "run-far", `- [ ] Run 5 km\n- [x] Run 3 km · done 2026-03-01\n- [ ] Run 10 km\n- [ ] Run 15 km`);
  todos(root, ["- [x] Buy shoes · toward [Run](../goals/run-far.md) · done 2026-04-02", "- [ ] Stretch daily · toward [Run](../goals/run-far.md)", "- [ ] Unrelated"]);
  const v = goalView(loadAll(root), RUN)!;
  assert.deepEqual([v.done, v.total, v.percent], [2, 6, 33]);
  assert.equal(v.toward.length, 2);
  assert.doesNotMatch(readFileSync(join(root, RUN), "utf8"), /percent/);
  goal(root, "run-far", `- [x] Run 5 km · done 2026-03-05\n- [x] Run 3 km · done 2026-03-01`);
  todos(root, ["- [x] Buy shoes · toward [Run](../goals/run-far.md) · done 2026-04-02"]);
  assert.equal(percent(root), 100);
});

test("a dropped to-do and a dropped target do not count", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [x] Run 5 km · done 2026-03-05\n- [x] Run 10 km · dropped");
  todos(root, ["- [x] Old plan · toward [Run](../goals/run-far.md) · done 2026-04-02 · dropped"]);
  assert.deepEqual([percent(root), goalView(loadAll(root), RUN)!.total], [100, 1]);
});

test("subgoals roll up into the parent bar, one level, and keep their own percent", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [x] Run 5 km · done 2026-03-05\n- [ ] Run 10 km");
  goal(root, "warm-up", "- [x] Stretch · done 2026-03-02\n- [x] Jog · done 2026-03-03\n- [ ] Sprint\n- [ ] Hills", "\nparent: run-far");
  todos(root, ["- [x] Buy mat · toward [Warm](../goals/warm-up.md) · done 2026-03-04", "- [ ] Foam roll · toward [Warm](../goals/warm-up.md)"]);
  const parent = goalView(loadAll(root), RUN)!;
  assert.deepEqual([parent.done, parent.total, parent.percent], [4, 8, 50]);
  assert.deepEqual(parent.subgoals.map((s) => [s.path, s.percent]), [[WARM, 50]]);
  assert.equal(goalView(loadAll(root), WARM)!.percent, 50);
  assert.equal(goalView(loadAll(root), WARM)!.parent, RUN);
  assert.deepEqual(goalList(loadAll(root)).map((g) => [g.path, g.percent]), [[RUN, 50]]);
});

test("wins come from done targets and done to-dos toward the goal, newest first", () => {
  const root = makeBrain();
  goal(root, "run-far", `- [x] Run 5 km · done ${addDays(now, -3)}\n- [ ] Run 10 km`);
  todos(root, [`- [x] Buy shoes · toward [Run](../goals/run-far.md) · done ${addDays(now, -1)}`, `- [x] Old win · toward [Run](../goals/run-far.md) · done 2020-01-01`]);
  const v = goalView(loadAll(root), RUN)!;
  assert.deepEqual(v.wins.map((w) => [w.text, w.kind]), [["Buy shoes", "todo"], ["Run 5 km", "target"], ["Old win", "todo"]]);
  assert.equal(v.recent, 2);
  assert.equal(v.next?.text, "Run 10 km");
});

test("a decide_by decision is a to-do on its date, until it is decided", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  decision(root, "shoes", "open", now);
  decision(root, "later", "open", tomorrow);
  const texts = () => dayList(root).map((i) => [i.kind, i.text, i.group]);
  assert.deepEqual(texts(), [["decision", "Decide: Pick shoes?", "today"]]);
  decision(root, "shoes", "decided", now);
  assert.deepEqual(texts(), []);
});

test("a decision linked through # Goals shows under the goal", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  decision(root, "shoes", "open", tomorrow);
  decision(root, "loose", "open", tomorrow, "- [Other](../goals/other.md)");
  const notes = loadAll(root);
  assert.deepEqual(goalView(notes, RUN)!.decisions, [{ path: "decisions/shoes.md", title: "Pick shoes?", status: "open", decide_by: tomorrow }]);
  const d = decisionView(notes, "decisions/shoes.md")!;
  assert.equal(d.goals[0].path, RUN);
  assert.equal(d.todo?.due, tomorrow);
  assert.equal(d.decided, "We chose the second.");
});

async function goalApi(t: TestContext) {
  const root = makeBrain();
  goal(root, "run-far", "- [x] Run 5 km · done 2026-03-05\n- [ ] Run 10 km");
  decision(root, "shoes", "open", now);
  const a = await startApi({}, root);
  t.after(() => a.close());
  return { a, notes: loadAll(root) };
}

test("GET /api/goals/:slug returns the goal view", async (t) => {
  const { a, notes } = await goalApi(t);
  const g = await a.call("GET", "/api/goals/run-far");
  assert.deepEqual(g.data, JSON.parse(JSON.stringify(goalView(notes, RUN))));
});

test("GET /api/goals/:path returns the same view as the slug", async (t) => {
  const { a } = await goalApi(t);
  const byPath = await a.call("GET", `/api/goals/${RUN}`);
  assert.deepEqual(byPath.data, (await a.call("GET", "/api/goals/run-far")).data);
});

test("GET /api/goals lists every goal", async (t) => {
  const { a, notes } = await goalApi(t);
  assert.deepEqual((await a.call("GET", "/api/goals")).data.goals, goalList(notes));
});

test("GET /api/decisions/:slug returns the decision view", async (t) => {
  const { a, notes } = await goalApi(t);
  const d = await a.call("GET", "/api/decisions/shoes");
  assert.deepEqual(d.data, JSON.parse(JSON.stringify(decisionView(notes, "decisions/shoes.md"))));
});

test("an unknown goal is 404", async (t) => {
  const { a } = await goalApi(t);
  assert.equal((await a.call("GET", "/api/goals/nope")).status, 404);
});

test("the decide-by to-do shows in the today view and on Today", async (t) => {
  const { a } = await goalApi(t);
  const view = await a.call("GET", "/api/todos?view=today");
  assert.deepEqual(view.data.items.map((i: { text: string }) => i.text), ["Decide: Pick shoes?"]);
  assert.equal((await a.call("GET", "/api/today")).data.items[0].text, "Decide: Pick shoes?");
});
