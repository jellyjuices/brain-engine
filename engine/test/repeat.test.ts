import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, today } from "../src/core/notes.ts";
import { done } from "../src/todos/verbs.ts";
import { skip, stopRepeat } from "../src/todos/repeat.ts";
import { undo } from "../src/todos/undo.ts";
import { makeBrain } from "./fixture.ts";

const now = today();
const PATH = "projects/shed-upkeep.md";

function brainWith(line: string): string {
  const root = makeBrain();
  writeFileSync(join(root, PATH), `---\ntype: Project\ntitle: Shed upkeep\ndescription: Keep the shed in shape.\n---\n\n# To-dos\n\n${line}\n\n# Notes\n`);
  return root;
}
const file = (root: string) => readFileSync(join(root, PATH), "utf8");
const todoLines = (root: string) => file(root).split("\n").filter((l) => l.startsWith("- "));
const ref = `${PATH}::Oil the hinges`;

test("done on a repeating to-do moves its date and adds one history line", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${addDays(now, -3)} · every week`);
  const r = done(root, ref);
  assert.equal(r.next, addDays(now, 4));
  assert.deepEqual(todoLines(root), [`- [ ] Oil the hinges · due ${addDays(now, 4)} · every week`, `- ${now} · Done: Oil the hinges`]);
});

test("done on an every ... when done to-do counts from today", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${addDays(now, -3)} · every week when done`);
  assert.equal(done(root, ref).next, addDays(now, 7));
});

test("undo of a repeating done puts back the date and removes the history line", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${addDays(now, -3)} · every week`);
  const before = file(root);
  done(root, ref);
  undo(root);
  assert.equal(file(root), before);
});

test("skip moves the date with no history line", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${now} · every month`);
  const r = skip(root, ref);
  assert.deepEqual(todoLines(root), [`- [ ] Oil the hinges · due ${r.next} · every month`]);
  assert.ok(r.next! > now, `next ${r.next} is not after ${now}`);
});

test("skip on a one-off to-do says it does not repeat", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${now}`);
  assert.throws(() => skip(root, ref), /not a repeating to-do/);
});

test("stop repeat keeps the date and removes the every token, and undo puts it back", () => {
  const root = brainWith(`- [ ] Oil the hinges · due ${now} · every month`);
  const before = file(root);
  stopRepeat(root, ref);
  assert.deepEqual(todoLines(root), [`- [ ] Oil the hinges · due ${now}`]);
  undo(root);
  assert.equal(file(root), before);
});
