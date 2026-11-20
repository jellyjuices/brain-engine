import { beforeEach, describe, expect, it, vi } from "vitest";
import { sortCapture } from "@/flows/inbox-flow.ts";
import { note } from "../helpers.ts";

const sheets = vi.hoisted(() => ({ sortSheet: vi.fn(), pickNote: vi.fn() }));
const queueSort = vi.hoisted(() => vi.fn());

vi.mock("@/components/sort-sheet/sort-sheet.tsx", () => ({ sortSheet: sheets.sortSheet }));
vi.mock("@/components/picker-sheet/picker-sheet.tsx", () => ({ pickNote: sheets.pickNote }));
vi.mock("@/lib/sync/writes.ts", () => ({ queueSort, queueInboxDrop: vi.fn() }));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["s1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

const capture = note("inbox/2026-11-05-ask-chantal.md", "Ask Chantal about the cottage dates");
const chantal = note("people/chantal.md", "", { title: "Chantal", type: "Person" });

beforeEach(() => {
  vi.clearAllMocks();
  queueSort.mockResolvedValue({ id: "s1", kind: "sort", payload: {}, created_at: "now" });
});

describe("sortCapture", () => {
  it("sorting into a picked person sends a When the Mac accepts", async () => {
    sheets.sortSheet.mockResolvedValue("else");
    sheets.pickNote.mockResolvedValue(chantal);

    await sortCapture(capture, [chantal]);

    expect(queueSort).toHaveBeenCalledWith(capture.path, chantal.path, "someday");
  });

  it("taking the suggested home sends that home with a When", async () => {
    sheets.sortSheet.mockResolvedValue("guess");

    await sortCapture(capture, [chantal]);

    expect(queueSort).toHaveBeenCalledWith(capture.path, chantal.path, "someday");
  });

  it("closing the sheet sends nothing", async () => {
    sheets.sortSheet.mockResolvedValue(null);

    await sortCapture(capture, [chantal]);

    expect(queueSort).not.toHaveBeenCalled();
  });
});
