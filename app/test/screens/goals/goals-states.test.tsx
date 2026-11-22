import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GoalScreen } from "@/screens/goal/goal.tsx";
import { GoalsScreen } from "@/screens/goals/goals.tsx";
import { go } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

beforeAll(unlockTestVault);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Goals states", () => {
  it("says it is loading while the home server has not answered", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined)),
    );
    render(<GoalsScreen />);
    expect(screen.getByRole("status")).toHaveTextContent(copy.states.loading(copy.goals.what));
  });

  it("says the home server is out of reach when offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<GoalsScreen />);
    expect(await screen.findByText(copy.goals.offlineTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.states.tryAgain })).toBeNull();
  });

  it("says it could not load on a server error, and Try again loads the goals", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(reply(500, { error: "Boom" }))
        .mockResolvedValue(reply(200, { goals: [] })),
    );
    render(<GoalsScreen />);
    expect(await screen.findByText(copy.states.errorTitle(copy.goals.what))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.states.tryAgain }));
    expect(await screen.findByText(copy.goals.noGoalsTitle)).toBeInTheDocument();
  });
});

describe("Goal states", () => {
  it("a goal that does not exist says missing, not offline", async () => {
    go("/goal/goals/sample-goal.md");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(404, { error: "No goal" })));
    render(<GoalScreen />);
    expect(await screen.findByText(copy.goals.missingTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.goals.offlineTitle)).toBeNull();
  });

  it("no connection says offline, not missing", async () => {
    go("/goal/goals/sample-goal.md");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<GoalScreen />);
    expect(await screen.findByText(copy.goals.offlineTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.goals.missingTitle)).toBeNull();
  });
});
