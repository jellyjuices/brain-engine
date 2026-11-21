import { describe, expect, it } from "vitest";
import { shareToText } from "@/lib/notes/capture.ts";
import { previewWhen } from "@/lib/notes/when.ts";

const NOW = "2026-11-05";

describe("When chip", () => {
  it("has no chip for empty text", () => {
    expect(previewWhen("   ", NOW)).toBeNull();
  });
  it("plain text goes to the inbox", () => {
    expect(previewWhen("buy milk", NOW)).toEqual({ kind: "inbox", label: "Inbox" });
  });
  it("reads today, tomorrow, someday, waiting and note", () => {
    expect(previewWhen("today: call Alex", NOW)).toEqual({ kind: "today", label: "Today" });
    expect(previewWhen("tomorrow: call Alex", NOW)).toMatchObject({
      kind: "date",
      label: "Tomorrow, Fri, Nov 6",
    });
    expect(previewWhen("someday: learn piano", NOW)?.kind).toBe("someday");
    expect(previewWhen("waiting: reply from Em", NOW)?.kind).toBe("waiting");
    expect(previewWhen("note: GP retires", NOW)).toEqual({ kind: "note", label: "Note" });
  });
  it("reads weekdays as the next one, never today", () => {
    expect(previewWhen("mon: plan week", NOW)?.label).toBe("Mon, Nov 9");
    expect(previewWhen("thu: again", NOW)?.label).toBe("Thu, Nov 12");
  });
  it("reads an ISO date and rejects an impossible one", () => {
    expect(previewWhen("2026-12-01: pay rent", NOW)?.label).toBe("Tue, Dec 1");
    expect(previewWhen("2026-02-31: nope", NOW)?.kind).toBe("inbox");
  });
  it("needs text after the prefix, like the Mac", () => {
    expect(previewWhen("tomorrow:", NOW)?.kind).toBe("inbox");
    expect(previewWhen("tomorrow:call", NOW)?.kind).toBe("inbox");
  });
  it("an unknown word is just text", () => {
    expect(previewWhen("re: lunch", NOW)?.kind).toBe("inbox");
  });
});

describe("share", () => {
  it("joins title, text and url, skipping repeats", () => {
    expect(shareToText(new URLSearchParams({ title: "A", text: "B", url: "https://x.ca" }))).toBe(
      "A\nB\nhttps://x.ca",
    );
    expect(shareToText(new URLSearchParams({ title: "A", text: "A" }))).toBe("A");
  });
});
