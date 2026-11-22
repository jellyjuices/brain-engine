import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TodayScreen } from "@/screens/today/today.tsx";
import { META } from "@/lib/storage/keys.ts";
import { replaceAll, setMeta } from "@/lib/storage/store.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

beforeAll(unlockTestVault);

beforeEach(async () => {
  resetSyncState();
  await replaceAll([]);
  await setMeta(META.lastSync, "2026-11-04T15:30:00.000Z");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Today states", () => {
  it("offline with no notes on the device says so and when it last synced", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<TodayScreen />);
    expect(await screen.findByText(copy.states.offlineTitle)).toBeInTheDocument();
    expect(screen.getByText(/Showing the copy on this device\. Last synced/)).toBeInTheDocument();
  });

  it("a server error with no notes on the device offers Try again", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(500, { error: "Boom" })));
    render(<TodayScreen />);
    expect(await screen.findByRole("button", { name: copy.states.tryAgain })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      copy.states.errorTitle(copy.states.yourNotes),
    );
  });
});
