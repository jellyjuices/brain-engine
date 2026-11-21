import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { go } from "@/lib/platform/router.ts";
import { clearStore, getNote, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { GoalTodosScreen } from "@/screens/goal-todos/goal-todos.tsx";
import { copy } from "@/content/index.ts";
import { fixture, note, unlockTestVault } from "../../helpers.ts";

const goal = note("goals/sample-goal.md", "# Why\n\nSample reason.\n", {
  type: "Goal",
  title: "Sample goal",
});

beforeAll(unlockTestVault);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
  registerWrites();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes([...fixture(), goal]);
  go("/goal-todos/goals/sample-goal.md");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function search() {
  const user = userEvent.setup();
  render(<GoalTodosScreen />);
  const box = await screen.findByRole("combobox");
  return { user, box };
}

describe("Add to-dos page", () => {
  it("cannot add until a to-do is picked, and names the goal on the button", async () => {
    await search();
    expect(
      screen.getByRole("button", { name: copy.goals.addTodosTo(0, "Sample goal") }),
    ).toBeDisabled();
  });

  it("links a picked existing to-do to the goal and goes back to the goal", async () => {
    const { user, box } = await search();
    await user.click(box);
    await user.click(screen.getByRole("option", { name: /Buy a sample item/ }));
    await user.click(screen.getByRole("button", { name: copy.goals.addTodosTo(1, "Sample goal") }));
    await vi.waitFor(() => expect(location.pathname).toBe("/goal/goals/sample-goal.md"));
    expect((await getNote("areas/fitness.md"))?.body).toContain(
      "toward [Sample goal](../goals/sample-goal.md)",
    );
  });

  it("adds a typed new to-do as a target on the goal", async () => {
    const { user, box } = await search();
    await user.type(box, "Run a sample route");
    await user.click(screen.getByRole("button", { name: copy.goals.addTodo }));
    await user.click(screen.getByRole("button", { name: copy.goals.addTodosTo(1, "Sample goal") }));
    await vi.waitFor(() => expect(location.pathname).toBe("/goal/goals/sample-goal.md"));
    expect((await getNote("goals/sample-goal.md"))?.body).toContain("- [ ] Run a sample route");
  });

  it("says the goal is missing when the route names no goal", async () => {
    go("/goal-todos/goals/nothing.md");
    render(<GoalTodosScreen />);
    expect(await screen.findByText(copy.goals.missingTitle)).toBeVisible();
  });
});
