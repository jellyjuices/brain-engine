import { describe, expect, it } from "vitest";
import type { GoalView } from "@shared/todos/index.ts";
import { crossTarget, linkedPaths } from "@/lib/notes/goals.ts";

const BODY = [
  "# Why",
  "",
  "Feel strong.",
  "",
  "# Targets",
  "",
  "- [x] First sample target · done 2026-10-02",
  "- [ ] Second sample target",
  "",
  "# To-dos",
  "",
  "- [ ] Second sample target",
].join("\n");

const GOAL: GoalView = {
  path: "goals/sample-goal.md",
  title: "Sample goal",
  status: "active",
  percent: 50,
  done: 1,
  total: 2,
  description: "",
  why: "",
  areas: ["health"],
  recent: 1,
  targets: [],
  toward: [
    {
      text: "Book a sample visit",
      done: false,
      path: "projects/sample-project.md",
      goal: "goals/sample-goal.md",
    },
    {
      text: "Sample step",
      done: false,
      path: "goals/sample-goal.md",
      goal: "goals/sample-goal.md",
    },
    { text: "Run 5 km", done: false, path: "goals/run-more.md", goal: "goals/run-more.md" },
  ],
  wins: [],
  subgoals: [
    {
      path: "goals/run-more.md",
      title: "Run more",
      status: "active",
      percent: 0,
      done: 0,
      total: 1,
    },
  ],
  decisions: [],
};

describe("goal notes", () => {
  it("crosses the open target under # Targets with today's date", () => {
    expect(
      crossTarget(BODY, "Second sample target", "2026-11-05")?.split("\n").slice(6, 8),
    ).toEqual([
      "- [x] First sample target · done 2026-10-02",
      "- [x] Second sample target · done 2026-11-05",
    ]);
  });

  it("leaves the same words under # To-dos alone", () => {
    expect(crossTarget(BODY, "Second sample target", "2026-11-05")?.split("\n").at(-1)).toBe(
      "- [ ] Second sample target",
    );
  });

  it("finds no target that is already done", () => {
    expect(crossTarget(BODY, "First sample target", "2026-11-05")).toBeNull();
  });

  it("lists linked notes, not the goal or its subgoals", () => {
    expect(linkedPaths(GOAL)).toEqual(["projects/sample-project.md"]);
  });
});
