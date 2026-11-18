import { describe, expect, it } from "vitest";
import { liveSegments } from "@/lib/notes/live-marks.ts";
import { toggleMarks } from "@/lib/notes/markers.ts";

const none = { names: [], tags: [] };

describe("liveSegments", () => {
  it("hides the stars around bold text", () => {
    expect(liveSegments("call **mom** now", none)).toEqual([
      { text: "call ", marks: [] },
      { text: "**", marks: ["mark"] },
      { text: "mom", marks: ["bold"] },
      { text: "**", marks: ["mark"] },
      { text: " now", marks: [] },
    ]);
  });

  it("shows the stars until the closing pair is typed", () => {
    expect(liveSegments("call **mom", none)).toEqual([{ text: "call **mom", marks: [] }]);
  });

  it("keeps the text the same length so the caret stays put", () => {
    const value = "a **b _c_** _d_ ****";
    expect(
      liveSegments(value, none)
        .map((s) => s.text)
        .join(""),
    ).toBe(value);
  });

  it("nests italic inside bold", () => {
    const segs = liveSegments("**_hi_**", none);
    expect(segs.find((s) => s.text === "hi")?.marks).toEqual(["bold", "italic"]);
  });

  it("hides an empty pair so a tap on bold shows no stars", () => {
    expect(liveSegments("hi ****", none)[1]).toEqual({ text: "****", marks: ["mark"] });
  });

  it("marks picked people and tags with their sign", () => {
    const segs = liveSegments("see @Ana about #work, not @Bob", { names: ["Ana"], tags: ["work"] });
    expect(segs.filter((s) => s.marks.includes("mention")).map((s) => s.text)).toEqual([
      "@Ana",
      "#work",
    ]);
  });

  it("draws a dash at a line start as a bullet only when asked", () => {
    expect(liveSegments("- milk", none)[0]).toEqual({ text: "- ", marks: ["bullet"] });
    expect(liveSegments("- milk", none, false)[0]?.marks).toEqual([]);
  });
});

describe("toggleMarks", () => {
  it("bolds the word at the caret and keeps the caret in place", () => {
    expect(toggleMarks("call mom now", 6, 6, "**")).toEqual({
      value: "call **mom** now",
      start: 8,
      end: 8,
    });
  });

  it("takes bold off the word at the caret", () => {
    expect(toggleMarks("call **mom** now", 8, 8, "**")).toEqual({
      value: "call mom now",
      start: 6,
      end: 6,
    });
  });
});
