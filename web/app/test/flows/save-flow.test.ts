import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveFlow } from "@/flows/save-flow.ts";
import type { OutboxItem } from "@/lib/sync/outbox.ts";
import { copy } from "@/content/index.ts";

const outbox = vi.hoisted(() => ({
  flush: vi.fn(),
  has: vi.fn(),
}));
const toast = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync/outbox.ts", () => outbox);
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast }));

const item: OutboxItem = { id: "a1", kind: "inbox", payload: {}, created_at: "now" };

beforeEach(() => {
  vi.clearAllMocks();
  outbox.flush.mockResolvedValue({ sent: ["a1"], dropped: [], left: 0 });
  outbox.has.mockResolvedValue(false);
});

describe("saveFlow", () => {
  it("shows the done words once the Mac has the write", async () => {
    expect(await saveFlow(() => Promise.resolve(item), "Saved")).toBe(true);
    expect(toast).toHaveBeenCalledWith("Saved");
  });

  it("works out the done words after the write is sent", async () => {
    await saveFlow(
      () => Promise.resolve(item),
      () => Promise.resolve("Later words"),
    );
    expect(toast).toHaveBeenCalledWith("Later words");
  });

  it("says the write waits on this phone when it is still in the outbox", async () => {
    outbox.has.mockResolvedValue(true);
    await saveFlow(() => Promise.resolve(item), "Saved");
    expect(toast).toHaveBeenCalledWith(expect.any(String), { tone: "offline", ms: 5000 });
  });

  it("says the Mac refused the write when it was dropped", async () => {
    outbox.flush.mockResolvedValue({ sent: [], dropped: ["a1"], left: 0 });
    await saveFlow(() => Promise.resolve(item), "Saved");
    expect(toast).toHaveBeenCalledWith(copy.save.rejected, { tone: "error" });
  });

  it("says the save failed when the write throws", async () => {
    expect(await saveFlow(() => Promise.reject(new Error("no")), "Saved")).toBe(false);
    expect(toast).toHaveBeenCalledWith(copy.save.failed, { tone: "error" });
  });
});
