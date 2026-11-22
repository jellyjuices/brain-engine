import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore } from "@/lib/storage/store.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { NoteRead } from "@/screens/note/note-read.tsx";
import { copy } from "@/content/index.ts";
import { unlockTestVault } from "../../helpers.ts";
import { reply } from "../../shell/shell-setup.tsx";

const PATH = "projects/garden-shed.md";

function serve(noteStatus: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url.startsWith("/api/notes?")
          ? reply(200, { now: "2026-11-05T09:00:00.000Z", notes: [] })
          : reply(noteStatus, { error: "No note" }),
      ),
    ),
  );
}

beforeAll(unlockTestVault);

beforeEach(async () => {
  resetSyncState();
  await clearStore();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Note states", () => {
  it("a note the home server does not have says it is missing", async () => {
    serve(404);
    render(<NoteRead path={PATH} />);
    expect(await screen.findByText(copy.notes.missingTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.states.offlineTitle)).toBeNull();
  });

  it("no connection says offline, not missing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<NoteRead path={PATH} />);
    expect(await screen.findByText(copy.states.offlineTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.notes.missingTitle)).toBeNull();
  });

  it("a server error offers Try again", async () => {
    serve(500);
    render(<NoteRead path={PATH} />);
    expect(await screen.findByRole("button", { name: copy.states.tryAgain })).toBeInTheDocument();
  });
});
