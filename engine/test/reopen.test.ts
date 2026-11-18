import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { today } from "../src/core/notes.ts";
import { readLog } from "../src/core/log.ts";
import { done } from "../src/todos/verbs.ts";
import { editTodoText, reopen } from "../src/todos/reopen.ts";
import { ref } from "../src/todos/day-list.ts";
import { undo } from "../src/todos/undo.ts";
import { reopenTodoIn, retextTodoIn } from "../shared/line/index.ts";
import { makeBrain } from "./fixture.ts";

const now = today();
const PATH = "projects/visit.md";

function brainWith(lines: string): string {
  const root = makeBrain();
  writeFileSync(join(root, PATH), `---\ntype: Project\ntitle: Family doctor visit\ndescription: A visit.\n---\n\n# To-dos\n\n${lines}\n`);
  return root;
}
const file = (root: string) => readFileSync(join(root, PATH), "utf8");

test("reopen puts a done to-do back as open, drops its done date and note, and undo puts it back", () => {
  const root = brainWith(`- [ ] Ask about Advil · re [Sleep](../topics/sleep.md) · due 2026-11-20\n- [ ] Book the sleep test`);
  const before = file(root);
  done(root, "Advil", { note: "She said yes." });
  const ticked = file(root);
  const r = reopen(root, ref(PATH, "Ask about Advil"));
  assert.equal(r.line, "Not done: Ask about Advil · undo");
  assert.equal(file(root), before);
  assert.match(readLog(root, 1)[0]?.msg ?? "", /^reopen: Ask about Advil/);
  undo(root);
  assert.equal(file(root), ticked);
});

test("reopen keeps a dated note that is not from the same day", () => {
  const body = `- [x] Call Omar · done 2026-10-01\n- 2026-10-02 · He called back.`;
  assert.equal(reopenTodoIn(body, "Call Omar"), `- [ ] Call Omar\n- 2026-10-02 · He called back.`);
});

test("reopen on an open to-do says it is not done", () => {
  const root = brainWith(`- [ ] Book the sleep test`);
  assert.throws(() => reopen(root, ref(PATH, "Book the sleep test")), /not a done to-do/);
});

test("edit changes the words and keeps every token, and undo puts it back", () => {
  const root = brainWith(`- [ ] Ask about Advil · with [Dana Cole](../people/dana-cole.md) · toward [Sleep well](../goals/sleep-well.md) · due 2026-11-20 · every month`);
  const before = file(root);
  const r = editTodoText(root, ref(PATH, "Ask about Advil"), "Ask the doctor about Advil");
  assert.equal(r.text, "Ask the doctor about Advil");
  assert.match(file(root), /- \[ \] Ask the doctor about Advil · with \[Dana Cole\]\(\.\.\/people\/dana-cole\.md\) · toward \[Sleep well\]\(\.\.\/goals\/sleep-well\.md\) · due 2026-11-20 · every month\n/);
  undo(root);
  assert.equal(file(root), before);
});

test("edit works on a done to-do and keeps it done", () => {
  const body = `- [x] Call Omar · done ${now}`;
  assert.equal(retextTodoIn(body, "Call Omar", "Call Omar back"), `- [x] Call Omar back · done ${now}`);
});

test("edit with no words is refused", () => {
  const root = brainWith(`- [ ] Book the sleep test`);
  assert.throws(() => editTodoText(root, ref(PATH, "Book the sleep test"), "  "), /new words/);
});

test("a ref outside the brain is refused", () => {
  const root = brainWith(`- [x] Book the sleep test · done ${now}`);
  assert.throws(() => reopen(root, "../secret.md::Book the sleep test"), /outside the brain/);
});
