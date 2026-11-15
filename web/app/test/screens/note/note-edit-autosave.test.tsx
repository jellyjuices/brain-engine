import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_MS, readDraft, storeDraft } from "@/lib/storage/drafts.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { NoteEdit } from "@/screens/note/note-edit.tsx";
import { fakeTimeouts, fixture, unlockTestVault } from "../../helpers.ts";

const FITNESS = { ...fixture()[0]!, body: "Gym three times a week." };
const EM = { ...fixture()[2]!, body: "Likes tea." };

beforeAll(unlockTestVault);
afterEach(() => {
  vi.useRealTimers();
  cleanup();
});
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes([FITNESS, EM]);
  await Promise.all((await list()).map((item) => remove(item.id)));
});

async function sentBodies() {
  return (await list()).map((item) => (item.payload as { body: string }).body);
}

async function typeMore(text: string, note = FITNESS, user = userEvent.setup()) {
  const view = render(<NoteEdit note={note} />);
  await user.type(screen.getByRole("textbox", { name: "Edit note" }), text);
  return view;
}

describe("note edit autosave", () => {
  it("has no save or cancel button", () => {
    render(<NoteEdit note={FITNESS} />);
    expect(screen.queryByRole("button", { name: /Save|Cancel/ })).toBeNull();
  });

  it("keeps the edit on the phone after a pause", async () => {
    await typeMore(" Swim on Sunday.", FITNESS, fakeTimeouts());
    await vi.advanceTimersByTimeAsync(DRAFT_MS);
    vi.useRealTimers();
    await vi.waitFor(async () =>
      expect(await readDraft(FITNESS.path)).toEqual({
        text: "Gym three times a week. Swim on Sunday.",
        tags: FITNESS.tags,
        base: FITNESS.hash,
      }),
    );
  });

  it("sends the edit when you leave the screen", async () => {
    const view = await typeMore(" Swim on Sunday.");
    view.unmount();
    await vi.waitFor(async () =>
      expect(await sentBodies()).toEqual(["Gym three times a week. Swim on Sunday."]),
    );
  });

  it("sends nothing when you leave without a change", async () => {
    const view = render(<NoteEdit note={FITNESS} />);
    view.unmount();
    (await typeMore(" Oolong on Fridays.", EM)).unmount();
    await vi.waitFor(async () => expect(await sentBodies()).toHaveLength(1));
    expect(await sentBodies()).toEqual(["Likes tea. Oolong on Fridays."]);
  });

  it("opens with the edit kept on the phone", async () => {
    await storeDraft(FITNESS.path, { text: "Rest day.", tags: [], base: FITNESS.hash });
    render(<NoteEdit note={FITNESS} />);
    expect(await screen.findByDisplayValue("Rest day.")).toBeInTheDocument();
  });
});
