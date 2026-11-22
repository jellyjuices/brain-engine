import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { longDate } from "@/lib/notes/model.ts";
import { selectEditable } from "@/lib/platform/editable.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { fixture, unlockTestVault } from "../../helpers.ts";

const queued = {
  id: "c0ffee03",
  kind: "inbox",
  payload: {},
  created_at: "2026-11-19T10:00:00",
};
const queueInbox = vi.fn(async (..._args: unknown[]) => queued);
const queueJournal = vi.fn(async (..._args: unknown[]) => queued);
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
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-21T10:00:00"));
  queueInbox.mockClear();
  queueJournal.mockClear();
  await clearStore();
  await putNotes(fixture());
});

const tomorrow = "2026-11-22";

async function openAdd(kind: "To-do" | "Journal", text: string) {
  const user = userEvent.setup();
  render(<AddPanel />);
  await user.click(screen.getByRole("button", { name: "Add" }));
  await user.click(screen.getByRole("menuitem", { name: kind }));
  const box = screen.getByRole("textbox", { name: kind });
  box.focus();
  box.textContent = text;
  selectEditable(box, text.length, text.length);
  fireEvent.input(box);
  return { user, box };
}

async function pickTomorrow(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Date" }));
  await user.click(screen.getByRole("button", { name: /Tomorrow/ }));
}

describe("date button in the add tool bar", () => {
  it("opens the date menu and closes it again", async () => {
    const { user } = await openAdd("To-do", "Call mom");
    const button = screen.getByRole("button", { name: "Date" });
    await user.click(button);
    expect(screen.getByRole("list", { name: "Dates" })).toBeTruthy();
    expect(button.getAttribute("aria-pressed")).toBe("true");
    await user.click(button);
    expect(screen.queryByRole("list", { name: "Dates" })).toBeNull();
  });

  it("shows the picked date as a chip and leaves the text alone", async () => {
    const { user, box } = await openAdd("To-do", "Call mom");
    await pickTomorrow(user);
    expect(box.textContent).toBe("Call mom");
    expect(screen.getByText(longDate(tomorrow))).toBeTruthy();
    expect(screen.queryByRole("list", { name: "Dates" })).toBeNull();
  });

  it("saves a to-do with the date as its When word", async () => {
    const { user } = await openAdd("To-do", "Call mom");
    await pickTomorrow(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(queueInbox.mock.calls[0]?.[0]).toBe(`${tomorrow}: Call mom`);
  });

  it("saves a journal entry with the date as its date value", async () => {
    const { user } = await openAdd("Journal", "Good day");
    await pickTomorrow(user);
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(queueJournal.mock.calls[0]?.[0]).toMatchObject({ text: "Good day", date: tomorrow });
  });

  it("removes the date when the chip is removed", async () => {
    const { user } = await openAdd("To-do", "Call mom");
    await pickTomorrow(user);
    await user.click(screen.getByRole("button", { name: `Remove ${longDate(tomorrow)}` }));
    expect(screen.queryByText(longDate(tomorrow))).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(queueInbox.mock.calls[0]?.[0]).toBe("Call mom");
  });

  it("a date picked with @ also becomes a chip, not text", async () => {
    const { user, box } = await openAdd("To-do", "Call mom @tom");
    await user.click(screen.getByRole("button", { name: /Tomorrow/ }));
    expect(box.textContent).toBe("Call mom ");
    expect(screen.getByText(longDate(tomorrow))).toBeTruthy();
  });
});
