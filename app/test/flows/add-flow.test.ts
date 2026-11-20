import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTodo } from "@/flows/add-flow.ts";

const queueInbox = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync/writes.ts", () => ({ queueInbox, queueUndo: vi.fn() }));
vi.mock("@/lib/storage/store.ts", () => ({ getNote: vi.fn(() => Promise.resolve(undefined)) }));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["a1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

const text = "Book the cottage for July";

beforeEach(() => {
  vi.clearAllMocks();
  queueInbox.mockResolvedValue({ id: "a1", kind: "inbox", payload: {}, created_at: "now" });
});

describe("addTodo", () => {
  it.each([
    {
      name: "a picked subject home becomes the into path",
      home: { kind: "subject", value: "people/chantal.md", title: "Chantal" },
      want: [text, "people/chantal.md", ["summer"]],
    },
    {
      name: "a picked tag home is added to the tags once",
      home: { kind: "tag", value: "cottage", title: "cottage" },
      want: [text, undefined, ["summer", "cottage"]],
    },
    {
      name: "no home sends no into",
      home: null,
      want: [text, undefined, ["summer"]],
    },
  ])("$name", async ({ home, want }) => {
    await addTodo({ text, tags: ["summer"], home } as Parameters<typeof addTodo>[0]);

    expect(queueInbox).toHaveBeenCalledWith(...want);
  });
});
