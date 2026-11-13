import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { go } from "@/lib/platform/router.ts";
import { readDraft } from "@/lib/storage/drafts.ts";
import { clearStore } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { AddScreen } from "@/screens/add/add.tsx";
import { draft } from "@/screens/add/draft.ts";
import { unlockTestVault } from "../../helpers.ts";

beforeAll(unlockTestVault);
afterEach(() => {
  cleanup();
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
});
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  draft.text = "";
  draft.tags = [];
  go("/add");
  await clearStore();
  await Promise.all((await list()).map((item) => remove(item.id)));
});

async function typeCapture(text: string) {
  const user = userEvent.setup();
  const view = render(<AddScreen />);
  await user.type(screen.getByRole("textbox", { name: "Add" }), text);
  return view;
}

async function sentTexts() {
  return (await list()).map((item) => (item.payload as { text: string }).text);
}

describe("add screen autosave", () => {
  it("has no save button", () => {
    render(<AddScreen />);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("keeps the text on the phone after a pause", async () => {
    await typeCapture("Buy eggs for meal prep");
    await vi.waitFor(async () =>
      expect(await readDraft("add")).toEqual({ text: "Buy eggs for meal prep", tags: [] }),
    );
  });

  it("does not send to the brain while typing", async () => {
    await typeCapture("Buy eggs for meal prep");
    expect(await sentTexts()).toEqual([]);
  });

  it("sends the capture when you leave the screen", async () => {
    const view = await typeCapture("Call Aisha about the GP");
    view.unmount();
    await vi.waitFor(async () => expect(await sentTexts()).toEqual(["Call Aisha about the GP"]));
  });

  it("sends the capture when the app is closed", async () => {
    await typeCapture("Book the dentist");
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(async () => expect(await sentTexts()).toEqual(["Book the dentist"]));
  });
});
