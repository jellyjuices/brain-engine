import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, toastSnapshot } from "@/components/toast/toast-store.ts";
import { archiveInboxItem } from "@/flows/inbox-flow.ts";
import { clearStore, getNote } from "@/lib/storage/store.ts";
import { flush, list, remove } from "@/lib/sync/outbox.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { note, unlockTestVault } from "../helpers.ts";

const capture = note("inbox/2026-11-05-ask-chantal.md", "Ask Chantal about the cottage dates");

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await clearStore();
  for (const item of await list()) await remove(item.id);
  clearToasts();
  resetSyncState();
  registerWrites();
});

function tapUndo() {
  toastSnapshot()
    .at(0)
    ?.actions.find((a) => a.label === "Undo")
    ?.onClick();
}

function answering(drop: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (path: string) => new Response(JSON.stringify(path === "/api/inbox-drop" ? drop : {})),
    ),
  );
}
function undoBodies() {
  const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [
    string,
    RequestInit,
  ][];
  return calls
    .filter(([path]) => path === "/api/undo")
    .map(([, init]) => JSON.parse(String(init.body)));
}

describe("deleting a capture", () => {
  it("says Deleted, and Undo asks the Mac to undo it and puts the capture back", async () => {
    answering({ undo_id: "9d2f" });
    await archiveInboxItem(capture, () => Promise.resolve());
    expect(toastSnapshot()[0]?.message).toBe("Deleted");
    await clearStore();

    tapUndo();

    await vi.waitFor(async () => {
      await flush();
      expect(undoBodies()).toEqual([{ id: "9d2f" }]);
    });
    await vi.waitFor(async () => expect(await getNote(capture.path)).toBeDefined());
  });

  it("offline, Undo cancels the queued delete and puts the capture back", async () => {
    await archiveInboxItem(capture, () => Promise.resolve());
    expect(await list()).toHaveLength(1);
    await clearStore();

    tapUndo();

    await vi.waitFor(async () => expect(await list()).toEqual([]));
    await vi.waitFor(async () => expect(await getNote(capture.path)).toBeDefined());
  });
});
