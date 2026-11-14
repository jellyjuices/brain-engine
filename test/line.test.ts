import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fieldsOf, formatTodoLine, parseTodoLine, SEP, tickTodo, updateTodo } from "../shared/line/index.ts";

type Golden = { line: string; parsed: unknown };
const golden: Golden[] = JSON.parse(readFileSync(new URL("../shared/line/golden.json", import.meta.url), "utf8"));

const FUZZ_TOKENS = ["due 2026-11-20", "check", "energy low", "with [Pat Doe](../people/pat-doe.md)", "about the weekend", "someday", "spot by the gate", "toward [Print a zine](../goals/print-a-zine.md)", "every week"];

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

test("T1 golden lines parse to their typed object", () => {
  assert.deepEqual(golden.map((row) => parseTodoLine(row.line)), golden.map((row) => row.parsed));
});

test("T2 every golden line formats back to itself", () => {
  assert.deepEqual(golden.map((row) => formatTodoLine(parseTodoLine(row.line)!)), golden.map((row) => row.line));
});

test("unknown tokens keep their order and stay out of the text", () => {
  const todo = parseTodoLine("- [ ] Mend the fence · spot by the gate · check · energy low")!;
  assert.deepEqual(fieldsOf(todo), { text: "Mend the fence", done: false, check: true, unknown: ["spot by the gate", "energy low"] });
});

test("ticking a to-do keeps check and unknown tokens in place", () => {
  const todo = parseTodoLine("- [ ] Call the bike shop · check · energy low · every week · due 2026-11-14")!;
  assert.equal(formatTodoLine(tickTodo(todo, "2026-11-14")), "- [x] Call the bike shop · check · energy low · due 2026-11-14 · done 2026-11-14");
});

test("a moved to-do keeps its tokens and changes only its When", () => {
  const todo = parseTodoLine("- [ ] Bake rye bread · energy low · due 2026-11-15 · check")!;
  assert.equal(formatTodoLine(updateTodo(todo, { due: undefined, outcome: "someday" })), "- [ ] Bake rye bread · energy low · check · someday");
});

test("T2 fuzz: shuffled tokens round trip in the order written", () => {
  const random = seeded(20261114);
  const lines = Array.from({ length: 200 }, () => `- [ ] Fold the maps${SEP}${shuffled(FUZZ_TOKENS, random).slice(0, 1 + Math.floor(random() * FUZZ_TOKENS.length)).join(SEP)}`);
  assert.deepEqual(lines.map((line) => formatTodoLine(parseTodoLine(line)!)), lines);
});
