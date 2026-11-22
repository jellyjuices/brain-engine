import { describe, expect, it } from "vitest";
import { failed } from "@/lib/sync/loaded.ts";
import { notesState } from "@/lib/sync/notes-state.ts";

const IDLE = { offline: false, syncing: false, failed: false };
const SYNCED = { ...IDLE, lastSync: "2026-11-05T09:00:00.000Z" };

describe("notesState", () => {
  it.each([
    ["notes not read yet", null, IDLE, "loading"],
    ["notes on the device, offline", 3, { ...SYNCED, offline: true }, "ready"],
    ["no notes, offline", 0, { ...SYNCED, offline: true }, "offline"],
    ["no notes, last sync failed", 0, { ...IDLE, failed: true }, "error"],
    ["no notes, first sync running", 0, { ...IDLE, syncing: true }, "loading"],
    ["no notes, synced", 0, SYNCED, "ready"],
  ] as const)("%s is %s", (_name, count, sync, expected) => {
    expect(notesState(count, sync)).toBe(expected);
  });
});

describe("failed", () => {
  it.each([
    ["no connection", { offline: true as const }, "offline"],
    ["a 404", { offline: false as const, status: 404 }, "missing"],
    ["a 500", { offline: false as const, status: 500 }, "error"],
  ])("%s is %s", (_name, res, expected) => {
    expect(failed(res)).toEqual({ kind: expected });
  });
});
