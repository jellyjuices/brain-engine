import "fake-indexeddb/auto";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts } from "@/components/toast/toast-store.ts";
import { Toasts } from "@/components/toast/toasts.tsx";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { BuildScreen } from "@/screens/build/build.tsx";
import { copy } from "@/content/index.ts";
import { fixture, unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

const words = copy.goals.build;

beforeAll(unlockTestVault);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
  clearToasts();
  registerWrites();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      url === "/api/notes"
        ? Promise.resolve(reply(200, { path: "goals/sample-goal.md", created: true }))
        : Promise.reject(new TypeError("offline")),
    ),
  );
  await clearStore();
  await putNotes(fixture());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function sentGoal() {
  const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [
    string,
    RequestInit,
  ][];
  const call = calls.find(([url]) => url === "/api/notes");
  return call && JSON.parse(String(call[1].body));
}

async function openAtName() {
  const user = userEvent.setup();
  history.pushState({}, "", "/build/goal");
  render(<BuildScreen />);
  await screen.findByRole("heading", { name: words.nameQuestion });
  return user;
}

async function reachAreas() {
  const user = await openAtName();
  await user.type(screen.getByLabelText(words.name), "Sample goal");
  await user.click(screen.getByRole("button", { name: words.next }));
  await user.click(screen.getByRole("button", { name: copy.sort.skip }));
  await user.click(screen.getByRole("button", { name: copy.sort.skip }));
  return user;
}

describe("Goal builder", () => {
  it("starts at step 1 of 4 and cannot go on without a goal name", async () => {
    await openAtName();
    expect(screen.getByText(copy.sort.stepOf(1, 4))).toBeVisible();
    expect(screen.getByRole("button", { name: words.next })).toBeDisabled();
  });

  it("asks why the goal matters once it has a name", async () => {
    const user = await openAtName();
    await user.type(screen.getByLabelText(words.name), "Sample goal");
    await user.click(screen.getByRole("button", { name: words.next }));
    expect(screen.getByRole("heading", { name: words.whyQuestion("Sample goal") })).toBeVisible();
  });

  it("cannot add the goal until a life area is picked", async () => {
    await reachAreas();
    expect(screen.getByRole("button", { name: copy.goals.addGoal })).toBeDisabled();
  });

  it("names the picked life area on the add button", async () => {
    const user = await reachAreas();
    await user.click(screen.getByRole("button", { name: /Fitness/ }));
    expect(
      screen.getByRole("button", { name: words.addTo("Sample goal", ["Fitness"]) }),
    ).toBeEnabled();
  });

  it("adds the goal with its why, targets and life area", async () => {
    const user = await openAtName();
    await user.type(screen.getByLabelText(words.name), "Sample goal");
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.type(screen.getByLabelText(words.whyLabel), "Sample reason.");
    await user.click(screen.getByRole("button", { name: words.next }));
    const search = screen.getByRole("combobox");
    await user.type(search, "First sample to-do");
    await user.click(screen.getByRole("button", { name: copy.goals.addTodo }));
    await user.type(search, "Second sample to-do{Enter}");
    expect(screen.getByRole("heading", { name: new RegExp(copy.goals.todosAdded) })).toBeVisible();
    expect(screen.getByText("First sample to-do")).toBeVisible();
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.click(screen.getByRole("button", { name: /Fitness/ }));
    await user.click(screen.getByRole("button", { name: words.addTo("Sample goal", ["Fitness"]) }));
    await vi.waitFor(() => expect(location.pathname).toBe("/goals"));
    expect(sentGoal()).toEqual({
      type: "Goal",
      title: "Sample goal",
      areas: ["fitness"],
      fields: { why: "Sample reason." },
      sections: { "# Targets": ["- [ ] First sample to-do", "- [ ] Second sample to-do"] },
    });
  });

  it("moves a ticked existing to-do into the added list and back out when tapped again", async () => {
    const user = await openAtName();
    await user.type(screen.getByLabelText(words.name), "Sample goal");
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /Buy a sample item/ }));
    const added = screen.getByRole("region", { name: copy.goals.todosAdded });
    expect(within(added).getByRole("button", { name: /Buy a sample item/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(within(added).getByRole("button", { name: /Buy a sample item/ }));
    expect(screen.queryByRole("region", { name: copy.goals.todosAdded })).toBeNull();
  });

  it("typing the name of an existing to-do adds that to-do, not a new one", async () => {
    const user = await openAtName();
    await user.type(screen.getByLabelText(words.name), "Sample goal");
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.type(screen.getByRole("combobox"), "buy a sample item");
    await user.click(screen.getByRole("button", { name: copy.goals.addTodo }));
    const added = screen.getByRole("region", { name: copy.goals.todosAdded });
    expect(within(added).getByText("Fitness")).toBeVisible();
  });

  it("the back arrow goes back a step and keeps what was typed", async () => {
    const user = await openAtName();
    await user.type(screen.getByLabelText(words.name), "Sample goal");
    await user.click(screen.getByRole("button", { name: words.next }));
    await user.click(screen.getByRole("button", { name: copy.common.back }));
    expect(screen.getByLabelText(words.name)).toHaveValue("Sample goal");
  });

  it("stays on the last step and says so when the Mac turns the goal down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url === "/api/notes"
          ? Promise.resolve(reply(400, { error: "No area" }))
          : Promise.reject(new TypeError("offline")),
      ),
    );
    render(<Toasts />);
    const user = await reachAreas();
    await user.click(screen.getByRole("button", { name: /Fitness/ }));
    await user.click(screen.getByRole("button", { name: words.addTo("Sample goal", ["Fitness"]) }));
    expect(await screen.findByText(copy.toast.rejected)).toBeVisible();
    expect(location.pathname).toBe("/build/goal");
  });

  it("goes to Goals with the goal waiting to send when the Mac is out of reach", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("offline"))),
    );
    const user = await reachAreas();
    await user.click(screen.getByRole("button", { name: /Fitness/ }));
    await user.click(screen.getByRole("button", { name: words.addTo("Sample goal", ["Fitness"]) }));
    await vi.waitFor(() => expect(location.pathname).toBe("/goals"));
    expect((await list()).map((item) => item.kind)).toEqual(["goal"]);
  });
});
