import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { flush, has, list, remove } from "@/lib/sync/outbox.ts";
import { queueInbox, registerWrites } from "@/lib/sync/writes.ts";
import { resetSyncState } from "@/lib/sync/sync.ts";
import { unlockTestVault } from "../helpers.ts";

const toast = vi.hoisted(() => vi.fn());
vi.mock("@/components/toast/toast-store.ts", () => ({ toast }));

const { undoSaved } = await import("@/flows/undo-flow.ts");

function reply(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}
function answering(inbox: unknown) {
  return vi.fn(async (path: string) => reply(path === "/api/inbox" ? inbox : {}));
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
async function sendAll() {
  await vi.waitFor(async () => {
    await flush();
    expect(await list()).toEqual([]);
  });
}
async function land(itemId: string) {
  await vi.waitFor(async () => {
    await flush();
    expect(await has(itemId)).toBe(false);
  });
}

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  await flush();
  for (const item of await list()) await remove(item.id);
  resetSyncState();
  registerWrites();
  toast.mockClear();
});

describe("undoSaved", () => {
  it("an add not sent yet is pulled back and never reaches the Mac", async () => {
    const item = await queueInbox("Book the cottage for July");

    await undoSaved(item.id);

    expect([await list(), toast.mock.calls[0]?.[0]]).toEqual([[], "Undone"]);
  });

  it("an add that landed sends /api/undo with that add's own id", async () => {
    vi.stubGlobal("fetch", answering({ path: "inbox/cottage.md", undo_id: "7a3c9e01" }));
    const item = await queueInbox("Book the cottage for July");
    await land(item.id);

    await undoSaved(item.id);
    await sendAll();

    expect(undoBodies()).toEqual([{ id: "7a3c9e01" }]);
  });

  it("an add that landed with no undo id is too late and sends no undo", async () => {
    vi.stubGlobal("fetch", answering({ path: "inbox/cottage.md" }));
    const item = await queueInbox("Book the cottage for July");
    await land(item.id);

    await undoSaved(item.id);
    await sendAll();

    expect([undoBodies(), toast.mock.calls[0]?.[0]]).toEqual([[], "Too late to undo"]);
  });

  it("a second Undo tap on the same add sends no second undo", async () => {
    vi.stubGlobal("fetch", answering({ path: "inbox/cottage.md", undo_id: "7a3c9e01" }));
    const item = await queueInbox("Book the cottage for July");
    await land(item.id);
    await undoSaved(item.id);

    await undoSaved(item.id);
    await sendAll();

    expect(undoBodies()).toEqual([{ id: "7a3c9e01" }]);
  });

  it("Undo while the add is being sent waits for it, then undoes it by id", async () => {
    let land: (r: Response) => void = () => undefined;
    const inboxSent = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        if (path !== "/api/inbox") return Promise.resolve(reply({}));
        inboxSent();
        return new Promise<Response>((r) => (land = r));
      }),
    );
    const item = await queueInbox("Book the cottage for July");
    const sending = flush();
    await vi.waitFor(() => expect(inboxSent).toHaveBeenCalled());

    const undoing = undoSaved(item.id);
    land(reply({ path: "inbox/cottage.md", undo_id: "7a3c9e01" }));
    await Promise.all([sending, undoing]);
    await sendAll();

    expect(undoBodies()).toEqual([{ id: "7a3c9e01" }]);
  });
});
