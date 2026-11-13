import { describe, expect, it } from "vitest";
import type { StoredNote } from "@/lib/notes/model.ts";
import { inboxText, setWhenWord, tagsInUse } from "@/lib/notes/capture.ts";

describe("setWhenWord", () => {
  it("adds, swaps and clears the When word", () => {
    expect(setWhenWord("call Aisha", "tomorrow")).toBe("tomorrow: call Aisha");
    expect(setWhenWord("tomorrow: call Aisha", "2026-11-20")).toBe("2026-11-20: call Aisha");
    expect(setWhenWord("today: call Aisha", "")).toBe("call Aisha");
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
