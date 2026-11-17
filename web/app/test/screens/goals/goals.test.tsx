import "fake-indexeddb/auto";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalView } from "@/lib/notes/goals.ts";
import { go } from "@/lib/platform/router.ts";
import { GoalScreen } from "@/screens/goal/goal.tsx";
import { GoalsScreen } from "@/screens/goals/goals.tsx";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

const GET_FIT: GoalView = {
  path: "goals/get-fit.md",
  title: "Get fit",
  status: "active",
  percent: 40,
  done: 2,
  total: 5,
  description: "",
  why: "Feel strong on hikes.",
  areas: ["health"],
  recent: 2,
  next: {
    text: "Book a trainer",
    done: false,
    path: "projects/gym-plan.md",
    goal: "goals/get-fit.md",
    ref: "projects/gym-plan.md::Book a trainer",
  },
  targets: [
    { text: "Bench 205 lb", done: false, path: "goals/get-fit.md", goal: "goals/get-fit.md" },
  ],
  toward: [
    {
      text: "Book a trainer",
      done: false,
      path: "projects/gym-plan.md",
      goal: "goals/get-fit.md",
      ref: "projects/gym-plan.md::Book a trainer",
    },
  ],
  wins: [
    {
      date: "2026-11-02",
      text: "Bench 185 lb",
      kind: "target",
      path: "goals/get-fit.md",
      goal: "goals/get-fit.md",
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
  decisions: [{ path: "decisions/join-a-gym.md", title: "Join a gym?", status: "open" }],
};

function serve() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/goals"
          ? reply(200, { goals: [GET_FIT] })
          : url === "/api/goals/goals/get-fit.md"
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
    const card = await screen.findByRole("article", { name: "Get fit" });
    expect(within(card).getByRole("progressbar", { name: "Get fit" })).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("puts subgoals and the goal's own decisions under it", async () => {
    serve();
    render(<GoalsScreen />);
    const card = await screen.findByRole("article", { name: "Get fit" });
    expect(
      within(card)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual([
      "/goal/goals/get-fit.md",
      "/goal/goals/run-more.md",
      "/note/decisions/join-a-gym.md",
    ]);
  });

  it("says when the Mac is out of reach", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<GoalsScreen />);
    expect(await screen.findByText(copy.goals.offlineTitle)).toBeInTheDocument();
  });
});

describe("goal page", () => {
  it.each([
    [copy.goals.nextStep, "Book a trainer"],
    [copy.goals.targets, "Bench 205 lb"],
    [copy.goals.wins, "Bench 185 lb"],
    [copy.goals.projects, "gym-plan"],
  ])("shows %s", async (section, text) => {
    serve();
    go("/goal/goals/get-fit.md");
    render(<GoalScreen />);
    const part = await screen.findByRole("region", { name: section });
    expect(within(part).getByText(text)).toBeInTheDocument();
  });
});
