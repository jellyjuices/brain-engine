import "fake-indexeddb/auto";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts } from "@/components/toast/toast-store.ts";
import { Toasts } from "@/components/toast/toasts.tsx";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { TodosScreen } from "@/screens/todos/todos.tsx";
import { copy } from "@/content/index.ts";
import { fixture, NOW, unlockTestVault } from "../../helpers.ts";

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${NOW}T09:00:00`));
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes(fixture());
});

afterEach(() => {
  cleanup();
  clearToasts();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function draw() {
  render(
    <>
      <TodosScreen />
      <Toasts />
    </>,
  );
}

describe("To-dos screen", () => {
  it("opens on Today with only dated to-dos", async () => {
    draw();
    const late = await screen.findByRole("region", { name: copy.today.overdue });
    expect(within(late).getByRole("button", { name: "Follow up on the report" })).toBeVisible();
  });

  it("a tap on a view tab shows that view", async () => {
    const user = userEvent.setup();
    draw();
    await user.click(await screen.findByRole("tab", { name: copy.todos.viewOnHold }));
    expect(
      await screen.findByRole("button", { name: "Hear back about the quote" }),
    ).toBeInTheDocument();
  });

  it("a ticked to-do leaves the list", async () => {
    const user = userEvent.setup();
    draw();
    await user.click(await screen.findByRole("checkbox", { name: "Make a sample plan" }));
    await screen.findByText(copy.todos.doneOn("Fitness"));
    await vi.waitFor(() =>
      expect(screen.queryByRole("checkbox", { name: "Make a sample plan" })).toBeNull(),
    );
  });

  it.skip("the done toast says where it went and offers Follow-up and Undo", async () => {
    const user = userEvent.setup();
    draw();
    await user.click(await screen.findByRole("checkbox", { name: "Make a sample plan" }));
    const note = await screen.findByText(copy.todos.doneOn("Fitness"));
    expect(
      within(note.parentElement as HTMLElement)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual([copy.todos.followUp, copy.common.undo]);
  });
});
