import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, toastSnapshot } from "@/components/toast/toast-store.ts";
import { openInboxItem } from "@/flows/inbox-flow.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { flush, list, remove } from "@/lib/sync/outbox.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { note, unlockTestVault } from "../helpers.ts";

const inboxSheet = vi.hoisted(() => vi.fn());

vi.mock("@/components/inbox-sheet/inbox-sheet.tsx", () => ({ inboxSheet }));

const capture = note("inbox/2026-11-05-ask-chantal.md", "Ask Chantal about the cottage dates");
const chantal = note("people/chantal.md", "", { title: "Chantal", type: "Person" });

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await clearStore();
  await putNotes([chantal]);
  for (const item of await list()) await remove(item.id);
  clearToasts();
  resetSyncState();
  registerWrites();
});

function answering(sort: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => new Response(JSON.stringify(path === "/api/sort" ? sort : {}))),
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

describe("inbox sheet toasts", () => {
  it("sorting names the subject it went into", async () => {
    answering({ undo_id: "5c1e" });
    inboxSheet.mockResolvedValue({ kind: "sort", into: chantal.path, when: "someday" });

    await openInboxItem(capture);

    expect(toastSnapshot()[0]?.message).toBe("Added to Chantal");
  });

  it("Undo on the sort toast asks the home server to undo it", async () => {
    answering({ undo_id: "5c1e" });
    inboxSheet.mockResolvedValue({ kind: "sort", into: chantal.path, when: "someday" });
    await openInboxItem(capture);

    toastSnapshot()[0]
      ?.actions.find((a) => a.label === "Undo")
      ?.onClick();

    await vi.waitFor(async () => {
      await flush();
      expect(undoBodies()).toEqual([{ id: "5c1e" }]);
    });
  });

  it("deleting names the capture", async () => {
    answering({});
    inboxSheet.mockResolvedValue({ kind: "archive" });

    await openInboxItem(capture);

    expect(toastSnapshot()[0]?.message).toContain("Deleted: Ask Chantal about the cottage dates");
  });
});
