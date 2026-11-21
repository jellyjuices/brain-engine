import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTodo } from "@/flows/add-flow.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { toast } from "@/components/toast/toast-store.ts";
import { navigate } from "@/lib/platform/router.ts";
import { undoSaved } from "@/flows/undo-flow.ts";

const queueInbox = vi.hoisted(() => vi.fn());

vi.mock("@/lib/sync/writes.ts", () => ({ queueInbox }));
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
vi.mock("@/lib/platform/router.ts", async (original) => ({
  ...(await original<object>()),
  navigate: vi.fn(),
}));
vi.mock("@/flows/undo-flow.ts", () => ({ undoSaved: vi.fn() }));

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

describe("addTodo toast", () => {
  const home: Suggestion = {
    key: "areas/health.md",
    kind: "subject",
    value: "areas/health.md",
    title: "Health",
  };

  async function savedToast() {
    await addTodo({ text, tags: [], home });
    const [message, options] = vi.mocked(toast).mock.calls[0] ?? [];
    const actions = typeof options === "object" ? (options.actions ?? []) : [];
    return { message, actions };
  }

  it("says the to-do waits in Unsorted, even with a home picked", async () => {
    const { message } = await savedToast();

    expect(message).toBe("Added to Unsorted");
  });

  it("Move opens the Unsorted screen and never undoes the save", async () => {
    const { actions } = await savedToast();

    actions.find((a: { label: string }) => a.label === "Move")?.onClick();

    expect(navigate).toHaveBeenCalledWith("inbox");
    expect(undoSaved).not.toHaveBeenCalled();
  });
});
