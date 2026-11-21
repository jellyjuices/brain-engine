import "fake-indexeddb/auto";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalView } from "@shared/todos/index.ts";
import { go } from "@/lib/platform/router.ts";
import { GoalScreen } from "@/screens/goal/goal.tsx";
import { GoalsScreen } from "@/screens/goals/goals.tsx";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

const GET_FIT: GoalView = {
  path: "goals/sample-goal.md",
  title: "Sample goal",
  status: "active",
  percent: 40,
  done: 2,
  total: 5,
  description: "",
  why: "Feel strong on hikes.",
  areas: ["health"],
  recent: 2,
  next: {
    text: "Book a sample visit",
    done: false,
    path: "projects/sample-project.md",
    goal: "goals/sample-goal.md",
    ref: "projects/sample-project.md::Book a sample visit",
  },
  targets: [
    {
      text: "Second sample target",
      done: false,
      path: "goals/sample-goal.md",
      goal: "goals/sample-goal.md",
    },
  ],
  toward: [
    {
      text: "Book a sample visit",
      done: false,
      path: "projects/sample-project.md",
      goal: "goals/sample-goal.md",
      ref: "projects/sample-project.md::Book a sample visit",
    },
  ],
  wins: [
    {
      date: "2026-11-02",
      text: "First sample target",
      kind: "target",
      path: "goals/sample-goal.md",
      goal: "goals/sample-goal.md",
    },
  ],
  subgoals: [
    {
      path: "goals/run-more.md",
      title: "Run more",
      status: "active",
      percent: 50,
      done: 1,
      total: 2,
    },
  ],
  decisions: [{ path: "decisions/sample-decision.md", title: "Sample decision?", status: "open" }],
};

function serve() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/goals"
          ? reply(200, { goals: [GET_FIT] })
          : url === "/api/goals/goals/sample-goal.md"
            ? reply(200, GET_FIT)
            : reply(404, { error: "No goal" }),
      ),
    ),
  );
}

beforeAll(unlockTestVault);

beforeEach(() => go("/goals"));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Goals tab", () => {
  it("shows each goal with its percent bar", async () => {
    serve();
    render(<GoalsScreen />);
    const card = await screen.findByRole("article", { name: "Sample goal" });
    expect(within(card).getByRole("progressbar", { name: "Sample goal" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("Add goal opens the goal builder", async () => {
    const user = userEvent.setup();
    serve();
    render(<GoalsScreen />);
    await user.click(screen.getByRole("button", { name: copy.goals.addGoal }));
    expect(location.pathname).toBe("/build/goal");
  });

  it("puts subgoals and the goal's own decisions under it", async () => {
    serve();
    render(<GoalsScreen />);
    const card = await screen.findByRole("article", { name: "Sample goal" });
    expect(
      within(card)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual([
      "/goal/goals/sample-goal.md",
      "/goal/goals/run-more.md",
      "/note/decisions/sample-decision.md",
    ]);
  });

  it("says when the Mac is out of reach", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<GoalsScreen />);
    expect(await screen.findByText(copy.goals.offlineTitle)).toBeInTheDocument();
  });
});

describe("goal page subjects", () => {
  it("names each subject of the goal under the title", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(reply(200, { ...GET_FIT, areas: ["health", "fitness"] }))),
    );
    go("/goal/goals/sample-goal.md");
    render(<GoalScreen />);
    const header = (await screen.findByRole("heading", { name: "Sample goal" })).closest("header");
    expect(header).not.toBeNull();
    expect(within(header as HTMLElement).getByText("Health")).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText("Fitness")).toBeInTheDocument();
  });
});

describe("goal page add to-do", () => {
  const EMPTY: GoalView = { ...GET_FIT, next: undefined, targets: [], toward: [] };

  function serveGoal(goal: GoalView) {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(reply(200, goal))),
    );
    go("/goal/goals/sample-goal.md");
    render(<GoalScreen />);
  }

  it("the header Add to-do button opens the add to-dos page for that goal", async () => {
    const user = userEvent.setup();
    serveGoal(GET_FIT);
    await screen.findByRole("region", { name: copy.goals.targets });
    await user.click(screen.getByRole("button", { name: copy.goals.addTodo }));
    expect(location.pathname).toBe("/goal-todos/goals/sample-goal.md");
  });

  it("a goal with no to-dos shows an empty state with its own Add to-do button", async () => {
    const user = userEvent.setup();
    serveGoal(EMPTY);
    expect(await screen.findByText(copy.goals.noTodosTitle)).toBeVisible();
    const buttons = screen.getAllByRole("button", { name: copy.goals.addTodo });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]!);
    expect(location.pathname).toBe("/goal-todos/goals/sample-goal.md");
  });

  it("a goal with to-dos shows no empty state", async () => {
    serveGoal(GET_FIT);
    await screen.findByRole("region", { name: copy.goals.targets });
    expect(screen.queryByText(copy.goals.noTodosTitle)).toBeNull();
  });
});

describe("goal page", () => {
  it.each([
    [copy.goals.nextStep, "Book a sample visit"],
    [copy.goals.targets, "Second sample target"],
    [copy.goals.wins, "First sample target"],
    [copy.goals.projects, "sample-project"],
  ])("shows %s", async (section, text) => {
    serve();
    go("/goal/goals/sample-goal.md");
    render(<GoalScreen />);
    const part = await screen.findByRole("region", { name: section });
    expect(within(part).getByText(text)).toBeInTheDocument();
  });
});
