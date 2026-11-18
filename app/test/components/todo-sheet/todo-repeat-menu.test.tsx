import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodoSheet, type Step } from "@/components/todo-sheet/todo-sheet.tsx";
import { makeTodo } from "@/lib/notes/todos.ts";

afterEach(cleanup);

const NOW = "2026-11-17";
const hinges = makeTodo({
  text: "Oil the shed hinges",
  path: "projects/shed-upkeep.md",
  subject: "Shed upkeep",
  due: NOW,
  every: "month",
});

function menuTitles(start: Step) {
  render(<TodoSheet todo={hinges} start={start} now={NOW} finish={vi.fn()} />);
  return screen.getAllByRole("button").map((b) => b.textContent);
}

describe("the sheet for a repeating to-do", () => {
  it.each<Step>(["menu", "doneMenu", "done"])("from %s shows the repeat menu", (start) => {
    expect(menuTitles(start)).toEqual(
      expect.arrayContaining([
        "Done for now",
        "Skip this time",
        "Edit",
        "Stop repeating",
        "Delete",
      ]),
    );
  });

  it("never offers Mark not done", () => {
    expect(menuTitles("doneMenu")).not.toContain("Mark not done");
  });

  it.each([
    ["Done for now", { kind: "done" }],
    ["Skip this time", { kind: "skip" }],
    ["Stop repeating", { kind: "stopRepeat" }],
  ])("%s finishes with its change", async (title, decision) => {
    const finish = vi.fn();
    render(<TodoSheet todo={hinges} start="menu" now={NOW} finish={finish} />);
    await userEvent.setup().click(screen.getByRole("button", { name: title }));
    expect(finish).toHaveBeenCalledWith(decision);
  });
});
