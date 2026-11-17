import { describe, expect, it } from "vitest";
import golden from "@shared/line/golden.json";
import { fieldsOf, formatTodoLine, parseTodoLine, SEP, tickTodo } from "@shared/line/index.ts";

const FUZZ_TOKENS = [
  "due 2026-11-20",
  "check",
  "energy low",
  "with [Pat Doe](../people/pat-doe.md)",
  "about the weekend",
  "waiting",
  "spot by the gate",
  "toward [Print a zine](../goals/print-a-zine.md)",
];

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function shuffledLine(random: () => number) {
  const order = FUZZ_TOKENS.map((token) => ({ token, key: random() }));
  const tokens = order.sort((a, b) => a.key - b.key).map((entry) => entry.token);
  return `- [ ] Fold the maps${SEP}${tokens.slice(0, 1 + Math.floor(random() * tokens.length)).join(SEP)}`;
}

describe("shared to-do line", () => {
  it.each(golden)("T1 parses $line", ({ line, parsed }) => {
    expect(parseTodoLine(line)).toEqual(parsed);
  });

  it.each(golden)("T2 formats $line back to itself", ({ line }) => {
    expect(formatTodoLine(parseTodoLine(line)!)).toBe(line);
  });

  it("keeps unknown tokens in order, out of the text", () => {
    const todo = parseTodoLine("- [ ] Mend the fence · spot by the gate · check · energy low")!;
    expect(fieldsOf(todo)).toEqual({
      text: "Mend the fence",
      done: false,
      check: true,
      unknown: ["spot by the gate", "energy low"],
    });
  });

  it("ticks a to-do without folding check into its text", () => {
    const todo = parseTodoLine("- [ ] Call the bike shop · check · due 2026-11-14")!;
    expect(formatTodoLine(tickTodo(todo, "2026-11-14"))).toBe(
      "- [x] Call the bike shop · check · due 2026-11-14 · done 2026-11-14",
    );
  });

  it("T2 fuzz: shuffled tokens round trip in the order written", () => {
    const random = seeded(20261114);
    const lines = Array.from({ length: 200 }, () => shuffledLine(random));
    expect(lines.map((line) => formatTodoLine(parseTodoLine(line)!))).toEqual(lines);
  });
});
