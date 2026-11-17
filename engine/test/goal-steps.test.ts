import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadAll } from "../src/core/files.ts";
import { goalList, goalView } from "../src/reports/goals.ts";
import { withApi } from "./api-helpers.ts";
import { makeBrain } from "./fixture.ts";

const RUN = "goals/run-far.md";
const GOAL_LINK = "[Run far](../goals/run-far.md)";

function put(root: string, rel: string, front: string, body: string) {
  writeFileSync(join(root, rel), `---\n${front}\n---\n\n${body}`);
}

function goal(root: string, slug: string, body: string, extra = "") {
  put(root, `goals/${slug}.md`, `type: Goal\ntitle: Goal ${slug}\ndescription: A sample goal.\nwhy: Because.\nstatus: active\nareas: [health]${extra}`, `# Why\n\n# Targets\n\n# To-dos\n\n${body}\n\n# Wins\n\n# Notes\n`);
}

function project(root: string, slug: string, todos: string[], relation = "") {
  put(root, `projects/${slug}.md`, `type: Project\ntitle: Project ${slug}\ndescription: A sample project.\nareas: [health]`, `# To-dos\n\n${todos.join("\n")}\n\n${relation}\n`);
}

const view = (root: string, path = RUN) => goalView(loadAll(root), path)!;

test("a goal's own to-dos are steps", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [x] Buy shoes · done 2026-04-02\n- [ ] Plan a route");
  assert.deepEqual([view(root).done, view(root).total, view(root).percent], [1, 2, 50]);
});

test("a project linked from the project side counts", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  project(root, "race", ["- [x] Sign up · done 2026-04-02", "- [ ] Train", "- [ ] Pack"], `# Goals\n\n- ${GOAL_LINK}`);
  assert.deepEqual([view(root).done, view(root).total], [1, 3]);
});

test("a project linked from the goal side counts", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  project(root, "race", ["- [x] Sign up · done 2026-04-02", "- [ ] Train"]);
  writeFileSync(join(root, RUN), readFileSync(join(root, RUN), "utf8") + "\n# Projects\n\n- [Project race](../projects/race.md)\n");
  assert.deepEqual([view(root).done, view(root).total], [1, 2]);
});

test("a project that is not linked does not count", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [ ] One");
  project(root, "race", ["- [ ] Train"]);
  assert.equal(view(root).total, 1);
});

test("a to-do in a linked project and marked toward the goal counts once", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [ ] Own step");
  project(root, "race", [`- [ ] Train · toward ${GOAL_LINK}`, "- [ ] Pack"], `# Goals\n\n- ${GOAL_LINK}`);
  const v = view(root);
  assert.equal(v.total, 3);
  assert.equal(v.toward.filter((s) => s.text === "Train").length, 1);
});

test("a subgoal's project steps count to the parent, once even if the parent links the project too", () => {
  const root = makeBrain();
  goal(root, "run-far", "- [ ] Parent step");
  goal(root, "warm-up", "- [x] Stretch · done 2026-03-02", "\nparent: run-far");
  project(root, "race", ["- [ ] Train"], `# Goals\n\n- ${GOAL_LINK}\n- [Goal warm-up](../goals/warm-up.md)`);
  const v = view(root);
  assert.deepEqual([v.done, v.total], [1, 3]);
  assert.deepEqual(view(root, "goals/warm-up.md").total, 2);
  assert.equal(goalList(loadAll(root)).find((g) => g.path === RUN)!.total, 3);
});

test("steps are computed on read and no line is written to a note", () => {
  const root = makeBrain();
  goal(root, "run-far", "");
  project(root, "race", ["- [ ] Train"], `# Goals\n\n- ${GOAL_LINK}`);
  const before = readFileSync(join(root, RUN), "utf8");
  view(root);
  assert.equal(readFileSync(join(root, RUN), "utf8"), before);
});

test("a to-do added into a goal or project lands under its To-dos, and a project links to a goal in one call", () => withApi(async (a) => {
  const g = await a.call("POST", "/api/notes", { type: "Goal", title: "Run far", areas: ["fitness"] });
  const p = await a.call("POST", "/api/notes", { type: "Project", title: "Race day", areas: ["fitness"], relations: [{ to: g.data.path }] });
  await a.call("POST", "/api/add", { client_id: "t1", text: "Pick a race", kind: "todo", into: g.data.path });
  await a.call("POST", "/api/add", { client_id: "t2", text: "Book the bib", kind: "todo", into: p.data.path });
  assert.match(readFileSync(join(a.root, g.data.path), "utf8"), /# To-dos\n\n- \[ \] Pick a race\n/);
  assert.match(readFileSync(join(a.root, p.data.path), "utf8"), /# To-dos\n\n- \[ \] Book the bib\n/);
  const v = goalView(loadAll(a.root), g.data.path)!;
  assert.equal(v.total, 2);
}));

test("add_relation from a project to a goal writes under # Goals", () => withApi(async (a) => {
  const g = await a.call("POST", "/api/notes", { type: "Goal", title: "Save more", areas: ["money"] });
  const r = await a.call("POST", "/api/relations", { from: "projects/garden-shed.md", to: g.data.path });
  assert.equal(r.data.created, true);
  assert.match(readFileSync(join(a.root, "projects/garden-shed.md"), "utf8"), /# Goals\n\n- \[Save more\]/);
}));
