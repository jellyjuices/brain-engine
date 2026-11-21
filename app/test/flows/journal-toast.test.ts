import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveJournal } from "@/flows/create-flow.ts";

const queueJournal = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync/writes.ts", async (original) => ({
  ...(await original<object>()),
  queueJournal,
}));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["j1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

import { toast } from "@/components/toast/toast-store.ts";

beforeEach(() => {
  vi.clearAllMocks();
  queueJournal.mockResolvedValue({ id: "j1", kind: "journal", payload: {}, created_at: "now" });
});

describe("saveJournal", () => {
  it("the toast names the day of the entry", async () => {
    await saveJournal({ title: "A slow Sunday", text: "Long walk.", date: "2026-11-15" });

    expect(toast).toHaveBeenCalledWith("Saved to journal, Nov 15", {});
  });
});
