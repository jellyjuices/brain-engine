import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { WriteScreen } from "@/screens/write/write.tsx";
import { unlockTestVault } from "../../helpers.ts";

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
  await Promise.all((await list()).map((item) => remove(item.id)));
});

async function sentTexts() {
  return (await list()).map((item) => (item.payload as { text: string }).text);
}

describe("journal autosave", () => {
  it("has no save button", () => {
    render(<WriteScreen />);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("sends the entry when you leave the screen", async () => {
    const user = userEvent.setup();
    const view = render(<WriteScreen />);
    await user.type(screen.getByRole("textbox", { name: "Journal" }), "A slow, good Sunday.");
    view.unmount();
    await vi.waitFor(async () => expect(await sentTexts()).toEqual(["A slow, good Sunday."]));
  });
});
