import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResult } from "@/lib/sync/api.ts";
import { unlockTestVault } from "../../helpers.ts";
import { count, enqueue, flush, list, registerHandler, remove } from "@/lib/sync/outbox.ts";

const FIRST_ID = "3f0c2a4e-8b1d-4c6f-9a7e-5d2b1c0e4f6a";
const ok: ApiResult = { ok: true, status: 200, data: {} };
const offline: ApiResult = { ok: false, offline: true };
function fail(status: number): ApiResult {
  return { ok: false, offline: false, status, error: "no" };
}

beforeAll(unlockTestVault);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
});

describe("outbox", () => {
  it("stores writes oldest first with id, kind, payload and created_at", async () => {
    const a = await enqueue("t", { n: 1 }, FIRST_ID);
    await enqueue("t", { n: 2 });
    const items = await list();
    expect(items.map((i) => (i.payload as { n: number }).n)).toEqual([1, 2]);
    expect(a).toMatchObject({ kind: "t", payload: { n: 1 } });
    expect(a.id).toBe(FIRST_ID);
    expect(Date.parse(a.created_at)).not.toBeNaN();
    expect(await count()).toBe(2);
  });

  it("flush sends everything and empties the box", async () => {
    const send = vi.fn().mockResolvedValue(ok);
    registerHandler("t", send);
    await enqueue("t", 1);
    await enqueue("t", 2);
    const res = await flush();
    expect(send).toHaveBeenCalledTimes(2);
    expect(res).toMatchObject({ left: 0 });
    expect(res.sent).toHaveLength(2);
  });

  it("keeps items when offline and stops at the first one", async () => {
    const send = vi.fn().mockResolvedValue(offline);
    registerHandler("t", send);
    await enqueue("t", 1);
    await enqueue("t", 2);
    const res = await flush();
    expect(send).toHaveBeenCalledTimes(1);
    expect(res).toMatchObject({ sent: [], left: 2 });
  });

  it("keeps items on 401 (locked) and 5xx, drops a permanent 4xx", async () => {
    registerHandler("t", vi.fn().mockResolvedValueOnce(fail(401)));
    await enqueue("t", 1);
    expect((await flush()).left).toBe(1);
    registerHandler("t", vi.fn().mockResolvedValueOnce(fail(500)));
    expect((await flush()).left).toBe(1);
    registerHandler("t", vi.fn().mockResolvedValueOnce(fail(413)));
    const res = await flush();
    expect(res.dropped).toHaveLength(1);
    expect(res.left).toBe(0);
  });

  it("runs one flush at a time", async () => {
    let calls = 0;
    registerHandler("t", async () => (calls++, ok));
    await enqueue("t", 1);
    const [a, b] = await Promise.all([flush(), flush()]);
    expect(a).toBe(b);
    expect(calls).toBe(1);
  });

  it("uses the item id as a stable idempotency key across retries", async () => {
    const ids: string[] = [];
    registerHandler("t", async (item) => (ids.push(item.id), ids.length === 1 ? offline : ok));
    await enqueue("t", 1);
    await flush();
    await flush();
    expect(ids[0]).toBe(ids[1]);
  });
});
