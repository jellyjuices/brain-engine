import { describe, expect, it } from "vitest";
import type { TodoView } from "@shared/todos/index.ts";
import { groupView, localView } from "@/lib/notes/todo-views.ts";
import { fixture, NOW, note } from "../../helpers.ts";

const NOTES = [
  ...fixture(),
  note(
    "projects/sample-project.md",
    "# To-dos\n\n- [ ] Send the report · due 2026-11-12\n- [ ] Draft the brief · toward [Sample goal](../goals/sample-goal.md)\n",
    { type: "Project", title: "Sample project" },
  ),
];

function titles(view: TodoView) {
  return groupView(view, localView(NOTES, view, NOW), NOW).map((g) => [
    g.title,
    g.items.map((t) => t.text),
  ]);
}

describe("to-do views from the local copy", () => {
  it("Today holds only real dates, overdue first", () => {
    expect(titles("today")).toEqual([
      ["Overdue", ["Follow up on the report"]],
      ["Due today", ["Make a sample plan"]],
    ]);
  });

  it("Soon groups the next days by day", () => {
    expect(titles("soon")).toEqual([
      ["Mon Nov 9", ["Buy a sample item"]],
      ["Thu Nov 12", ["Send the report"]],
    ]);
  });

  it.each([
    [
      "no-date",
      [
        ["Alex", ["Call back"]],
        ["Sample project", ["Draft the brief"]],
      ],
    ],
    ["on-hold", [["Alex", ["Hear back about the quote"]]]],
    ["by-goal", [["Sample goal", ["Draft the brief"]]]],
  ] as const)("%s groups by its own heading", (view, groups) => {
    expect(titles(view)).toEqual(groups);
  });

  it("All counts every open to-do", () => {
    expect(localView(NOTES, "all", NOW)).toHaveLength(7);
  });
});
