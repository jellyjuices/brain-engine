import "fake-indexeddb/auto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { linkTodos } from "@/flows/goal-link-flow.ts";
import { clearStore, getNote, putNotes } from "@/lib/storage/store.ts";
import { list, remove } from "@/lib/sync/outbox.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { fixture, note, unlockTestVault } from "../helpers.ts";

const goal = note("goals/sample-goal.md", "# Why\n", { type: "Goal", title: "Sample goal" });

beforeAll(unlockTestVault);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
  registerWrites();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
  await clearStore();
  await putNotes(fixture());
});

afterEach(() => vi.unstubAllGlobals());

describe("linkTodos", () => {
  it("points a picked to-do at the new goal and queues the edit", async () => {
    await linkTodos(goal, [
      {
        key: "areas/fitness.md::Buy a sample item",
        text: "Buy a sample item",
        path: "areas/fitness.md",
        noteTitle: "Fitness",
      },
    ]);
    const saved = await getNote("areas/fitness.md");
    expect(saved?.body).toContain(
      "- [ ] Buy a sample item · toward [Sample goal](../goals/sample-goal.md) · due 2026-11-09",
    );
    expect((await list()).map((item) => item.kind)).toEqual(["edit"]);
  });

  it("queues nothing when only new to-dos were typed", async () => {
    await linkTodos(goal, [{ key: "new::run 5 km", text: "Run 5 km" }]);
    expect(await list()).toEqual([]);
  });
});
