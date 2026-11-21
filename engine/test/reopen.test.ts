import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { today } from "../src/core/notes.ts";
import { readLog } from "../src/core/log.ts";
import { done } from "../src/todos/verbs.ts";
import { dropDone, editTodoText, reopen } from "../src/todos/reopen.ts";
import { ref } from "../src/todos/day-list.ts";
import { undo } from "../src/todos/undo.ts";
import { reopenTodoIn, retextTodoIn } from "../shared/line/index.ts";
import { makeBrain } from "./fixture.ts";

const now = today();
const PATH = "projects/visit.md";

function brainWith(lines: string): string {
  const root = makeBrain();
  writeFileSync(join(root, PATH), `---\ntype: Project\ntitle: Sample visit\ndescription: A visit.\n---\n\n# To-dos\n\n${lines}\n`);
  return root;
}
const file = (root: string) => readFileSync(join(root, PATH), "utf8");

test("reopen puts a done to-do back as open, drops its done date and note, and undo puts it back", () => {
  const root = brainWith(`- [ ] Ask about the report · re [Sample topic](../topics/sample-topic.md) · due 2026-11-20\n- [ ] Book the sample test`);
  const before = file(root);
  done(root, "the report", { note: "They said yes." });
  const ticked = file(root);
  const r = reopen(root, ref(PATH, "Ask about the report"));
  assert.equal(r.line, "Not done: Ask about the report · undo");
  assert.equal(file(root), before);
  assert.match(readLog(root, 1)[0]?.msg ?? "", /^reopen: Ask about the report/);
  undo(root);
  assert.equal(file(root), ticked);
});

test("reopen keeps a dated note that is not from the same day", () => {
  const body = `- [x] Call Sam · done 2026-10-01\n- 2026-10-02 · They called back.`;
  assert.equal(reopenTodoIn(body, "Call Sam"), `- [ ] Call Sam\n- 2026-10-02 · They called back.`);
});

test("reopen on an open to-do says it is not done", () => {
  const root = brainWith(`- [ ] Book the sample test`);
  assert.throws(() => reopen(root, ref(PATH, "Book the sample test")), /not a done to-do/);
});

test("edit changes the words and keeps every token, and undo puts it back", () => {
  const root = brainWith(`- [ ] Ask about the report · with [Alex Sample](../people/alex-sample.md) · toward [Sample goal](../goals/sample-goal.md) · due 2026-11-20 · every month`);
  const before = file(root);
  const r = editTodoText(root, ref(PATH, "Ask about the report"), "Ask the team about the report");
  assert.equal(r.text, "Ask the team about the report");
  assert.match(file(root), /- \[ \] Ask the team about the report · with \[Alex Sample\]\(\.\.\/people\/alex-sample\.md\) · toward \[Sample goal\]\(\.\.\/goals\/sample-goal\.md\) · due 2026-11-20 · every month\n/);
  undo(root);
  assert.equal(file(root), before);
});

test("edit works on a done to-do and keeps it done", () => {
  const body = `- [x] Call Omar · done ${now}`;
  assert.equal(retextTodoIn(body, "Call Omar", "Call Omar back"), `- [x] Call Omar back · done ${now}`);
});

test("edit with no words is refused", () => {
  const root = brainWith(`- [ ] Book the sample test`);
  assert.throws(() => editTodoText(root, ref(PATH, "Book the sample test"), "  "), /new words/);
});

test("delete on a done to-do marks it dropped and keeps its done date; an open one is left to drop", () => {
  const root = brainWith(`- [x] Call Omar · done 2026-10-01\n- [ ] Book the sample test`);
  assert.equal(dropDone(root, ref(PATH, "Book the sample test")), null);
  dropDone(root, ref(PATH, "Call Omar"));
  assert.match(file(root), /- \[x\] Call Omar · done 2026-10-01 · dropped\n- \[ \] Book the sample test\n/);
});

test("a ref outside the brain is refused", () => {
  const root = brainWith(`- [x] Book the sample test · done ${now}`);
  assert.throws(() => reopen(root, "../secret.md::Book the sample test"), /outside the brain/);
});
