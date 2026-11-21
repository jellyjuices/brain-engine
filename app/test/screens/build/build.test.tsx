import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { BuildScreen } from "@/screens/build/build.tsx";
import { copy } from "@/content/index.ts";
import { fixture, unlockTestVault } from "../../helpers.ts";

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes(fixture());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function open(kind: string) {
  history.pushState({}, "", `/build/${kind}`);
  render(<BuildScreen />);
  await screen.findByRole("heading", { level: 2 });
}

describe("Build screen", () => {
  it("a new person starts at step 1 of 3 and cannot add without a name", async () => {
    const user = userEvent.setup();
    await open("person");
    expect(screen.getByRole("heading", { name: copy.sort.nameQuestion.person })).toBeVisible();
    expect(screen.getByText(copy.sort.stepOf(1, 3))).toBeVisible();
    const add = screen.getByRole("button", { name: copy.sort.addKind.person });
    expect(add).toBeDisabled();
    await user.type(screen.getByLabelText(copy.add.name), "Riley Chen");
    expect(add).toBeEnabled();
  });

  it("a new place asks for a name only, with no birthday", async () => {
    await open("place");
    expect(screen.getByRole("heading", { name: copy.sort.nameQuestion.place })).toBeVisible();
    expect(screen.queryByText(copy.add.birthdayOptional)).toBeNull();
  });
});
