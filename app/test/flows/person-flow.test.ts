import "fake-indexeddb/auto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addBirthday, addPartner } from "@/flows/person-flow.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { note, unlockTestVault } from "../helpers.ts";

const sheets = vi.hoisted(() => ({ birthdaySheet: vi.fn(), pickNote: vi.fn() }));
const queued = { id: "p1", kind: "edit", payload: {}, created_at: "now" };

vi.mock("@/components/person-sheet/person-sheet.tsx", () => ({
  birthdaySheet: sheets.birthdaySheet,
}));
vi.mock("@/components/picker-sheet/picker-sheet.tsx", () => ({ pickNote: sheets.pickNote }));
vi.mock("@/lib/sync/writes.ts", () => ({
  queueBirthday: vi.fn(() => Promise.resolve(queued)),
  queueEdit: vi.fn(() => Promise.resolve(queued)),
}));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["p1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

import { toast } from "@/components/toast/toast-store.ts";

const chantal = note("people/chantal.md", "# People\n", { title: "Chantal", type: "Person" });
const elena = note("people/elena.md", "", { title: "Elena", type: "Person" });

beforeAll(unlockTestVault);

beforeEach(async () => {
  vi.clearAllMocks();
  await clearStore();
  await putNotes([chantal, elena]);
});

describe("person toasts", () => {
  it("a saved birthday names the person", async () => {
    sheets.birthdaySheet.mockResolvedValue("1984-03-12");

    await addBirthday(chantal);

    expect(toast).toHaveBeenCalledWith("Saved to Chantal", {});
  });

  it("a saved partner names the person it was added to", async () => {
    sheets.pickNote.mockResolvedValue(elena);

    await addPartner(chantal);

    expect(toast).toHaveBeenCalledWith("Saved to Chantal", {});
  });
});
