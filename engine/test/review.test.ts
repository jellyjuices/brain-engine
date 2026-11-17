import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, today } from "../src/core/notes.ts";
import { readLog } from "../src/core/log.ts";
import { undo } from "../src/todos/undo.ts";
import { addNow, emptyResult, finishReview, reviewSteps } from "../src/todos/review.ts";
import { makeBrain } from "./fixture.ts";

const now = today();
const yesterday = addDays(now, -1);

test("an empty brain has no review steps", () => {
  assert.deepEqual(reviewSteps(makeBrain(), now), []);
});

test("only steps with items show, in order", () => {
  const root = makeBrain();
  writeFileSync(join(root, "projects/p.md"), `---\ntype: Project\ntitle: P\ndescription: A project.\nstale_after: 2020-01-01\n---\n\n# To-dos\n\n- [ ] Late one · due ${yesterday}\n- [ ] Wait for Omar · waiting\n- [ ] Maybe later · someday\n- [ ] Fine · due ${addDays(now, 3)}\n`);
  const steps = reviewSteps(root, now);
  assert.deepEqual(steps.map((s) => s.key), ["overdue", "stale", "waiting", "someday"]);
  assert.deepEqual(steps[0].items.map((i) => i.text), ["Late one"]);
  assert.deepEqual(steps.filter((s) => !s.items.length).map((s) => s.key), []);
});

test("addNow writes a dated line under # Now and undo reverses it", () => {
  const root = makeBrain();
  const file = () => readFileSync(join(root, "areas/health.md"), "utf8");
  const before = file();
  addNow(root, "health", "Started walking daily");
  assert.match(file(), new RegExp(`# Now\\n\\n- ${now} · Started walking daily\\n`));
  assert.ok(file().indexOf("Started walking") < file().indexOf("# To-dos"), `walking at ${file().indexOf("Started walking")}, to-dos at ${file().indexOf("# To-dos")}`);
  undo(root);
  assert.equal(file(), before);
});

test("addNow makes the # Now heading when it is missing", () => {
  const root = makeBrain();
  writeFileSync(join(root, "areas/health.md"), `---\ntype: Area\ntitle: Health\ndescription: Health.\n---\n\n# What this covers\n`);
  addNow(root, "health", "New thing");
  assert.match(readFileSync(join(root, "areas/health.md"), "utf8"), new RegExp(`# Now\\n\\n- ${now} · New thing\\n`));
});

test("finishReview writes weekly.md and one log line", () => {
  const root = makeBrain();
  const r = emptyResult();
  r.done.push("Done: X");
  const path = finishReview(root, [], r, now);
  assert.match(readFileSync(path, "utf8"), /# Weekly review/);
  assert.equal(readLog(root).filter((e) => e.msg.startsWith("weekly review")).length, 1);
});
