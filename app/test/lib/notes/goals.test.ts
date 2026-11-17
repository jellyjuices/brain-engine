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
  "- [x] Bench 185 lb · done 2026-10-02",
  "- [ ] Bench 205 lb",
  "",
  "# To-dos",
  "",
  "- [ ] Bench 205 lb",
].join("\n");

const GOAL: GoalView = {
  path: "goals/get-fit.md",
  title: "Get fit",
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
    { text: "Book a trainer", done: false, path: "projects/gym-plan.md", goal: "goals/get-fit.md" },
    { text: "Stretch", done: false, path: "goals/get-fit.md", goal: "goals/get-fit.md" },
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
    expect(crossTarget(BODY, "Bench 205 lb", "2026-11-05")?.split("\n").slice(6, 8)).toEqual([
      "- [x] Bench 185 lb · done 2026-10-02",
      "- [x] Bench 205 lb · done 2026-11-05",
    ]);
  });

  it("leaves the same words under # To-dos alone", () => {
    expect(crossTarget(BODY, "Bench 205 lb", "2026-11-05")?.split("\n").at(-1)).toBe(
      "- [ ] Bench 205 lb",
    );
  });

  it("finds no target that is already done", () => {
    expect(crossTarget(BODY, "Bench 185 lb", "2026-11-05")).toBeNull();
  });

  it("lists linked notes, not the goal or its subgoals", () => {
    expect(linkedPaths(GOAL)).toEqual(["projects/gym-plan.md"]);
  });
});
