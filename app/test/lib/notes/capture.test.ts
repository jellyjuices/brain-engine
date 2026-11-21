import { describe, expect, it } from "vitest";
import type { StoredNote } from "@/lib/notes/model.ts";
import { clip, inboxText, setWhenWord, tagsInUse } from "@/lib/notes/capture.ts";

describe("clip", () => {
  it("cuts a long line to 40 letters ending in an ellipsis", () => {
    expect(clip("Ask Chantal about the cottage dates for the long weekend in July")).toBe(
      "Ask Chantal about the cottage dates for…",
    );
  });
  it("keeps a line of exactly 40 letters", () => {
    const line = "Ask Chantal about the cottage dates now.";
    expect(line).toHaveLength(40);
    expect(clip(line)).toBe(line);
  });
  it("keeps a short line", () => {
    expect(clip("Call Alex")).toBe("Call Alex");
  });
  it("never splits an emoji at the cut", () => {
    const line = `${"a".repeat(39)}👩🏽‍🍳 and more`;
    expect(clip(line)).toBe(`${"a".repeat(39)}…`);
  });
});

describe("setWhenWord", () => {
  it("adds, swaps and clears the When word", () => {
    expect(setWhenWord("call Alex", "tomorrow")).toBe("tomorrow: call Alex");
    expect(setWhenWord("tomorrow: call Alex", "2026-11-20")).toBe("2026-11-20: call Alex");
    expect(setWhenWord("today: call Alex", "")).toBe("call Alex");
  });
  it("leaves a colon that is not a When word", () => {
    expect(setWhenWord("Idea: a shed", "someday")).toBe("someday: Idea: a shed");
  });
});

describe("tagsInUse", () => {
  it("lists tags, most used first", () => {
    function n(tags: string[]) {
      return { tags } as StoredNote;
    }
    expect(tagsInUse([n(["idea"]), n(["idea", "meeting"]), n(["decision"])])).toEqual([
      "idea",
      "decision",
      "meeting",
    ]);
  });
});

describe("inboxText", () => {
  function capture(title: string, body: string) {
    return { title, body } as StoredNote;
  }
  it("shows the full text once, not the cut title", () => {
    const long = "Begin learning muscles and tendons and shit for massage therapy, then more";
    expect(inboxText(capture("Begin learning muscles…", long))).toBe(long);
  });
  it("falls back to the title when there is no text", () => {
    expect(inboxText(capture("Groceries", "  "))).toBe("Groceries");
  });
});
