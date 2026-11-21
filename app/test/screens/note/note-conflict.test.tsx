import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { getConflict, recordConflict } from "@/lib/sync/conflict.ts";
import { NoteConflict } from "@/screens/note/note-conflict.tsx";
import { fixture, unlockTestVault } from "../../helpers.ts";

const FITNESS = fixture()[0]!;
const MAC = { ...FITNESS, body: "Mac text" };

beforeAll(unlockTestVault);
afterEach(cleanup);
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes([FITNESS]);
  await recordConflict({ path: FITNESS.path, mine: "My careful words", current: MAC });
});

async function open() {
  const conflict = (await getConflict(FITNESS.path))!;
  render(<NoteConflict note={FITNESS} conflict={conflict} />);
  return userEvent.setup();
}

describe("note conflict", () => {
  it("Keep home server version asks first and says the owner's version will be gone", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Keep home server version" }));
    expect(await screen.findByText(/Your version will be gone/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Go back" }));
  });

  it("going back keeps the owner's text and the conflict", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Keep home server version" }));
    await user.click(await screen.findByRole("button", { name: "Go back" }));
    expect((await getConflict(FITNESS.path))?.mine).toBe("My careful words");
  });

  it("closing the sheet keeps the owner's text too", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Keep home server version" }));
    await screen.findByText(/Your version will be gone/);
    await user.keyboard("{Escape}");
    expect((await getConflict(FITNESS.path))?.mine).toBe("My careful words");
  });

  it("confirming drops the owner's version", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Keep home server version" }));
    await user.click(await screen.findByRole("button", { name: "Delete my version" }));
    await vi.waitFor(async () => expect(await getConflict(FITNESS.path)).toBeUndefined());
  });

  it("Keep mine needs no confirm", async () => {
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Keep mine" }));
    await vi.waitFor(async () => expect(await getConflict(FITNESS.path)).toBeUndefined());
    expect(screen.queryByText(/Your version will be gone/)).toBeNull();
  });
});
