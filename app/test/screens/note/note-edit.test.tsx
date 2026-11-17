import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { NoteEdit } from "@/screens/note/note-edit.tsx";
import { fixture, note, unlockTestVault } from "../../helpers.ts";

const FITNESS = fixture()[0]!;

beforeAll(unlockTestVault);
afterEach(() => {
  cleanup();
});
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes([...fixture(), note("areas/money.md", "", { title: "Money", tags: ["money"] })]);
});

async function typeInto(text: string) {
  const user = userEvent.setup();
  render(<NoteEdit note={{ ...FITNESS, body: "" }} />);
  const field = screen.getByRole("textbox", { name: "Edit note" });
  await user.type(field, text);
  return { user, field };
}

describe("note edit mentions and tags", () => {
  it("@ lists people and puts a link to the picked one", async () => {
    const { user, field } = await typeInto("Call @Ai");
    await user.click(await screen.findByRole("button", { name: /Aisha/ }));
    expect(field).toHaveValue("Call [Aisha](../people/aisha.md) ");
  });

  it("# lists tags and adds the picked one as a removable tag", async () => {
    const { user, field } = await typeInto("Gym #mon");
    await user.click(await screen.findByRole("button", { name: /#money/ }));
    expect(field).toHaveValue("Gym ");
    expect(screen.getByRole("button", { name: "Remove #money" })).toBeInTheDocument();
  });

  it("Escape hides the list", async () => {
    const { user } = await typeInto("Call @Ai");
    await screen.findByRole("button", { name: /Aisha/ });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /Aisha/ })).toBeNull();
  });
});
