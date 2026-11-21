import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, toastSnapshot } from "@/components/toast/toast-store.ts";
import { clearStore, getNote, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { NoteEdit } from "@/screens/note/note-edit.tsx";
import { fixture, unlockTestVault } from "../../helpers.ts";

const FITNESS = { ...fixture()[0]!, body: "Sample text." };

beforeAll(unlockTestVault);
afterEach(() => {
  cleanup();
  clearToasts();
});
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes([FITNESS]);
  await Promise.all((await list()).map((item) => remove(item.id)));
  registerWrites();
});

describe("note edit undo", () => {
  it("an edit still waiting to send has Undo, and Undo takes it out of the outbox", async () => {
    const user = userEvent.setup();
    const view = render(<NoteEdit note={FITNESS} />);
    await user.type(screen.getByRole("textbox", { name: "Edit note" }), " More.");
    view.unmount();

    await vi.waitFor(() => expect(toastSnapshot()).toHaveLength(1));
    const undo = toastSnapshot()[0]?.actions.find((a) => a.label === "Undo");
    expect(await list()).toHaveLength(1);
    undo?.onClick();

    await vi.waitFor(async () => expect(await list()).toEqual([]));
    await vi.waitFor(async () => expect((await getNote(FITNESS.path))?.body).toBe("Sample text."));
  });
});
