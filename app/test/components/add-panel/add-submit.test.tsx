import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { selectEditable } from "@/lib/platform/editable.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { fixture, unlockTestVault } from "../../helpers.ts";

const queued = {
  id: "c0ffee04",
  kind: "inbox",
  payload: {},
  created_at: "2026-11-21T10:00:00",
};
const queueInbox = vi.fn(async (..._args: unknown[]) => queued);
const queueJournal = vi.fn(async (..._args: unknown[]) => queued);
const pickNote = vi.hoisted(() => vi.fn());
vi.mock("@/components/picker-sheet/picker-sheet.tsx", async (original) => ({
  ...(await original<object>()),
  pickNote,
}));
vi.mock("@/lib/platform/router.ts", () => ({ go: vi.fn() }));
vi.mock("@/flows/save-flow.ts", () => ({
  saveFlow: async (write: () => unknown) => {
    write();
    return true;
  },
}));
vi.mock("@/lib/sync/writes.ts", () => ({
  queueInbox: (...args: unknown[]) => queueInbox(...args),
  queueJournal: (...args: unknown[]) => queueJournal(...args),
}));

const { AddPanel } = await import("@/components/add-panel/add-panel.tsx");

beforeAll(unlockTestVault);
afterEach(cleanup);
beforeEach(async () => {
  queueInbox.mockClear();
  await clearStore();
  await putNotes(fixture());
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
  return box;
}

describe("shift and enter in the add panel", () => {
  it("saves the to-do", async () => {
    const box = await typeTodo("Call mom");
    fireEvent.keyDown(box, { key: "Enter", shiftKey: true });
    await vi.waitFor(() => expect(queueInbox.mock.calls[0]?.[0]).toBe("Call mom"));
  });

  it("does not save on Enter alone", async () => {
    const box = await typeTodo("Call mom");
    fireEvent.keyDown(box, { key: "Enter" });
    expect(queueInbox).not.toHaveBeenCalled();
  });
});

describe("saving a note", () => {
  it("queues the text about the subject, to be filed at once", async () => {
    const alex = fixture().find((n) => n.type === "Person")!;
    pickNote.mockResolvedValueOnce(alex);
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Note" }));
    const box = await screen.findByRole("textbox", { name: "Note" });
    box.focus();
    box.textContent = "Likes tea, not coffee.";
    selectEditable(box, 22, 22);
    fireEvent.input(box);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await vi.waitFor(() =>
      expect(queueJournal.mock.calls[0]?.[0]).toMatchObject({
        text: "Likes tea, not coffee.",
        about: alex.path,
        file_now: true,
      }),
    );
  });
});
