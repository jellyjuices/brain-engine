import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, toastSnapshot } from "@/components/toast/toast-store.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { NoteEdit } from "@/screens/note/note-edit.tsx";
import { fixture, unlockTestVault } from "../../helpers.ts";

const FITNESS = { ...fixture()[0]!, body: "Sample text three times a week." };

beforeAll(unlockTestVault);
afterEach(cleanup);
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({}))),
  );
  await clearStore();
  await putNotes([FITNESS]);
  await Promise.all((await list()).map((item) => remove(item.id)));
  clearToasts();
  resetSyncState();
  registerWrites();
});

describe("note edit toast", () => {
  it("names the note the edit was saved to", async () => {
    const user = userEvent.setup();
    const view = render(<NoteEdit note={FITNESS} />);
    await user.type(screen.getByRole("textbox", { name: "Edit note" }), " More on Sunday.");

    view.unmount();

    await vi.waitFor(() =>
      expect(toastSnapshot().map((t) => t.message)).toEqual([`Saved to ${FITNESS.title}`]),
    );
  });
});
