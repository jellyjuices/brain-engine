import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { go } from "@/lib/platform/router.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { AddScreen } from "@/screens/add/add.tsx";
import { draft } from "@/screens/add/draft.ts";
import { fixture, note, unlockTestVault } from "../../helpers.ts";

beforeAll(unlockTestVault);
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-07T12:00:00"));
  draft.text = "";
  draft.tags = [];
  go("/add");
  await clearStore();
  await putNotes([...fixture(), note("areas/money.md", "", { title: "Money", tags: ["money"] })]);
});

async function typeInto(text: string) {
  const user = userEvent.setup();
  render(<AddScreen />);
  const field = screen.getByRole("textbox", { name: /./ });
  await user.type(field, text);
  return { user, field };
}

describe("add screen mentions and tags", () => {
  it("@ puts the person's first name in the text", async () => {
    const { user, field } = await typeInto("Call @Ai");
    await user.click(await screen.findByRole("button", { name: /Aisha/ }));
    expect(field).toHaveValue("Call Aisha ");
  });

  it("@ a date sets the When word", async () => {
    const { user, field } = await typeInto("Call Em @tom");
    await user.click(await screen.findByRole("button", { name: /Tomorrow/ }));
    expect(field).toHaveValue("2026-11-08: Call Em ");
  });

  it("# adds the tag", async () => {
    const { user } = await typeInto("Pay rent #mon");
    await user.click(await screen.findByRole("button", { name: /^#money/ }));
    expect(screen.getByRole("button", { name: "Remove #money" })).toBeInTheDocument();
  });
});
