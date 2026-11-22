import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveNote } from "@/flows/create-flow.ts";
import type { StoredNote } from "@/lib/notes/model.ts";

const queueJournal = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync/writes.ts", async (original) => ({
  ...(await original<object>()),
  queueJournal,
}));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["n1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

import { toast } from "@/components/toast/toast-store.ts";

const alex: StoredNote = {
  path: "people/alex-sample.md",
  type: "Person",
  title: "Alex Sample",
  description: "",
  tags: [],
  status: "",
  modified: "2026-11-19",
  meta: {},
  body: "",
  hash: "a1",
};

beforeEach(() => {
  vi.clearAllMocks();
  queueJournal.mockResolvedValue({ id: "n1", kind: "journal", payload: {}, created_at: "now" });
});

describe("saveNote", () => {
  it("queues a note about the person, to be filed at once", async () => {
    await saveNote("Likes tea, not coffee.", alex, "2026-11-19");

    expect(queueJournal).toHaveBeenCalledWith({
      title: "",
      text: "Likes tea, not coffee.",
      date: "2026-11-19",
      about: "people/alex-sample.md",
      file_now: true,
    });
  });

  it("the toast names the person the note joined", async () => {
    await saveNote("Likes tea, not coffee.", alex, "2026-11-19");

    expect(toast).toHaveBeenCalledWith("Added to Alex Sample", {});
  });
});
