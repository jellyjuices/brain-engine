import "fake-indexeddb/auto";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts } from "@/components/toast/toast-store.ts";
import { Toasts } from "@/components/toast/toasts.tsx";
import { resetChanges } from "@/lib/sync/changes.ts";
import { clearStore, getNote, putNotes } from "@/lib/storage/store.ts";
import { NoteRead } from "@/screens/note/note-read.tsx";
import { copy } from "@/content/index.ts";
import { NOW, note, unlockTestVault } from "../../helpers.ts";

const PATH = "projects/garden-shed.md";
const SHED = note(
  PATH,
  "# To-dos\n\n- [x] Order cedar boards · done 2026-11-03\n- [ ] Call the roofer · due 2026-11-20\n- [x] Old plan · done 2026-11-01 · dropped\n",
  { title: "Garden shed", type: "Project" },
);

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${NOW}T09:00:00`));
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  resetChanges();
  await clearStore();
  await putNotes([SHED]);
});

afterEach(async () => {
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  cleanup();
  clearToasts();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function draw() {
  render(
    <>
      <NoteRead path={PATH} />
      <Toasts />
    </>,
  );
  return userEvent.setup();
}

async function bodyNow() {
  return (await getNote(PATH))?.body;
}

describe("to-dos on a note page", () => {
  it("shows done and open to-dos in one list, and leaves out deleted ones", async () => {
    draw();
    expect(await screen.findByRole("checkbox", { name: "Order cedar boards" })).toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: "Call the roofer" })[0]).not.toBeChecked();
    expect(screen.queryByText("Old plan")).toBeNull();
  });

  it("a tap on a done to-do opens a sheet with Mark not done, Edit and Delete", async () => {
    const user = draw();
    await user.click(await screen.findByRole("button", { name: "Order cedar boards" }));
    const names = [copy.todo.markNotDone, copy.common.edit, copy.todo.archive];
    expect(names.map((name) => screen.getByRole("button", { name }).textContent)).toEqual(names);
  });

  it("Mark not done puts it back as open, with Undo", async () => {
    const user = draw();
    await user.click(await screen.findByRole("button", { name: "Order cedar boards" }));
    await user.click(screen.getByRole("button", { name: copy.todo.markNotDone }));
    await waitFor(async () => expect(await bodyNow()).toContain("- [ ] Order cedar boards\n"));
    expect(await screen.findByRole("button", { name: copy.common.undo })).toBeVisible();
  });

  it("Edit changes the words and keeps the due date", async () => {
    const user = draw();
    const [row] = await screen.findAllByRole("button", { name: "Call the roofer" });
    await user.click(row!);
    await user.click(screen.getByRole("button", { name: copy.common.edit }));
    const field = screen.getByRole("textbox", { name: copy.todo.words });
    await user.clear(field);
    await user.type(field, "Call the roofer about tiles");
    await user.click(screen.getByRole("button", { name: copy.common.save }));
    await waitFor(async () =>
      expect(await bodyNow()).toContain("- [ ] Call the roofer about tiles · due 2026-11-20\n"),
    );
  });
});
