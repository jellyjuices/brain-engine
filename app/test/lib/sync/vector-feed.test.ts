import "fake-indexeddb/auto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { clearStore } from "@/lib/storage/store.ts";
import { loadVectors, type FeedVector } from "@/lib/storage/vectors.ts";
import { resetSyncState, syncNow } from "@/lib/sync/sync.ts";
import { unlockTestVault } from "../../helpers.ts";

const NOW = "2026-11-05T09:00:00.000Z";

function feedVector(id: string, values: number[]): FeedVector {
  const bytes = new Uint8Array(Int8Array.from(values).buffer);
  return { id, hash: `${id.slice(0, 7)}0000000`, vec: btoa(String.fromCharCode(...bytes)) };
}

const shed = feedVector("08d927fe8c7ac3", [12, -40, 127]);
const cafe = feedVector("1aa5116a9ec579", [-127, 3, 64]);
const bike = feedVector("2be4c0d19f7a10", [5, 5, -90]);

const server = { model: "", all: [] as FeedVector[], changed: [] as FeedVector[] };

function urls(): string[] {
  return (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.map((call) => String(call[0]));
}

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(NOW));
  await clearStore();
  resetSyncState();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      const vectors = url.includes("since=") ? server.changed : server.all;
      return new Response(JSON.stringify({ now: NOW, notes: [], model: server.model, vectors }));
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("vectors from the changes feed", () => {
  it("are stored by entry id, as int8", async () => {
    Object.assign(server, { model: "arctic-xs-1", all: [shed, cafe], changed: [] });
    await syncNow();
    const stored = await loadVectors();
    expect([...stored.keys()]).toEqual([shed.id, cafe.id]);
    expect([...stored.get(cafe.id)!.vec]).toEqual([-127, 3, 64]);
  });

  it("a new model stamp clears them and fetches all again", async () => {
    Object.assign(server, { model: "arctic-xs-1", all: [shed, cafe], changed: [] });
    await syncNow();
    Object.assign(server, { model: "arctic-xs-2", all: [bike], changed: [bike] });
    await syncNow();
    expect([...(await loadVectors()).keys()]).toEqual([bike.id]);
    expect(urls().slice(-2)).toEqual([expect.stringContaining("since="), "/api/notes"]);
  });

  it("the same model stamp keeps them and adds the changed ones", async () => {
    Object.assign(server, { model: "arctic-xs-1", all: [shed], changed: [] });
    await syncNow();
    Object.assign(server, { changed: [cafe] });
    await syncNow();
    expect([...(await loadVectors()).keys()].sort()).toEqual([shed.id, cafe.id]);
  });
});
