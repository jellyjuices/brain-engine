import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToasts, toastSnapshot } from "@/components/toast/toast-store.ts";
import { saveFlow } from "@/flows/save-flow.ts";
import { flush, list, remove } from "@/lib/sync/outbox.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { queueInbox, registerWrites } from "@/lib/sync/writes.ts";
import { unlockTestVault } from "../helpers.ts";

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  for (const item of await list()) await remove(item.id);
  clearToasts();
  resetSyncState();
  registerWrites();
});

function answering(inbox: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (path: string) => new Response(JSON.stringify(path === "/api/inbox" ? inbox : {}))),
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
function shown() {
  return toastSnapshot().map((t) => t.message);
}
function tapUndo() {
  toastSnapshot()
    .at(0)
    ?.actions.find((a) => a.label === "Undo")
    ?.onClick();
}
function save() {
  return saveFlow(() => queueInbox("Book the cottage"), "Saved");
}

describe("saveFlow Undo", () => {
  it("offline: the toast says it will send later and Undo takes the write out of the outbox", async () => {
    await save();
    expect(shown()[0]).toMatch(/offline|later/i);
    expect(await list()).toHaveLength(1);

    tapUndo();

    await vi.waitFor(async () => expect(await list()).toEqual([]));
    await vi.waitFor(() => expect(shown()).toContain("Undone"));
  });

  it("online with an undo id: Undo asks the Mac to undo that write", async () => {
    answering({ path: "inbox/cottage.md", undo_id: "7a3c9e01" });
    await save();
    expect(shown()[0]).toBe("Saved");

    tapUndo();

    await vi.waitFor(async () => {
      await flush();
      expect(undoBodies()).toEqual([{ id: "7a3c9e01" }]);
    });
  });

  it("online with no undo id: the toast has no Undo", async () => {
    answering({ path: "inbox/cottage.md" });
    await save();
    expect(toastSnapshot()[0]?.actions).toEqual([]);
  });

  it("queued, then sent with no undo id: Undo says there is nothing to undo", async () => {
    await save();
    answering({ path: "inbox/cottage.md" });
    await flush();

    tapUndo();

    await vi.waitFor(() => expect(shown()).toContain("Nothing to undo"));
    expect(undoBodies()).toEqual([]);
  });

  it("queued, then sent with an undo id: Undo still undoes it after the send finished", async () => {
    await save();
    answering({ path: "inbox/cottage.md", undo_id: "7a3c9e01" });
    await flush();

    tapUndo();

    await vi.waitFor(async () => {
      await flush();
      expect(undoBodies()).toEqual([{ id: "7a3c9e01" }]);
    });
  });
});
