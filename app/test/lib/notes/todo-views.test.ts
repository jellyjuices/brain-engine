import { describe, expect, it } from "vitest";
import type { TodoView } from "@shared/todos/index.ts";
import { groupView, localView } from "@/lib/notes/todo-views.ts";
import { fixture, NOW, note } from "../../helpers.ts";

const NOTES = [
  ...fixture(),
  note(
    "projects/northwind.md",
    "# To-dos\n\n- [ ] Send the invoice · due 2026-11-12\n- [ ] Draft the brief · toward [Get fit](../goals/get-fit.md)\n",
    { type: "Project", title: "Northwind" },
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
      ["Overdue", ["Follow up on the invoice"]],
      ["Due today", ["Make a gym schedule"]],
    ]);
  });

  it("Soon groups the next days by day", () => {
    expect(titles("soon")).toEqual([
      ["Mon Nov 9", ["Buy a mat"]],
      ["Thu Nov 12", ["Send the invoice"]],
    ]);
  });

  it.each([
    [
      "no-date",
      [
        ["Aisha", ["Call back"]],
        ["Northwind", ["Draft the brief"]],
      ],
    ],
    ["on-hold", [["Aisha", ["Hear back about the quote"]]]],
    ["by-goal", [["Get fit", ["Draft the brief"]]]],
  ] as const)("%s groups by its own heading", (view, groups) => {
    expect(titles(view)).toEqual(groups);
  });

  it("All counts every open to-do", () => {
    expect(localView(NOTES, "all", NOW)).toHaveLength(7);
  });
});
