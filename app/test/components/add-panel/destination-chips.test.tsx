import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { OutboxItem } from "@/lib/sync/outbox.ts";
import { selectEditable } from "@/lib/platform/editable.ts";
import { note, unlockTestVault } from "../../helpers.ts";

const queueInbox = vi.fn();
const sent: { done: unknown }[] = [];
vi.mock("@/lib/platform/router.ts", () => ({ go: vi.fn() }));
vi.mock("@/flows/save-flow.ts", () => ({
  saveFlow: async (write: () => Promise<OutboxItem>, done: unknown) => {
    await write();
    sent.push({ done });
    return true;
  },
}));
vi.mock("@/lib/sync/writes.ts", () => ({ queueInbox, queueUndo: vi.fn() }));

const { AddPanel } = await import("@/components/add-panel/add-panel.tsx");
const { putNotes } = await import("@/lib/storage/store.ts");

beforeAll(unlockTestVault);
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-19T10:00:00"));
  queueInbox.mockClear();
  sent.length = 0;
  await putNotes([note("places/gym.md", "", { title: "Gym", type: "Place" })]);
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

async function typeTodo(text: string) {
  const user = userEvent.setup();
  render(<AddPanel />);
  await user.click(screen.getByRole("button", { name: "Add" }));
  await user.click(screen.getByRole("menuitem", { name: "To-do" }));
  const box = screen.getByRole("textbox", { name: "To-do" });
  box.focus();
  box.textContent = text;
  selectEditable(box, text.length, text.length);
  fireEvent.input(box);
  return user;
}

describe("AddPanel suggested home", () => {
  it("offers a subject the to-do names", async () => {
    await typeTodo("pay the gym fee fri");
    expect(await screen.findByRole("button", { name: "Sort to Gym" })).toBeInTheDocument();
  });

  it("files the to-do into the picked home and names it in the toast", async () => {
    const user = await typeTodo("pay the gym fee fri");
    await user.click(await screen.findByRole("button", { name: "Sort to Gym" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect([queueInbox.mock.calls[0], sent[0]?.done]).toMatchObject([
      ["pay the gym fee fri", "places/gym.md", []],
      { message: "Added to Gym", detail: "Fri Nov 20" },
    ]);
  });
});
