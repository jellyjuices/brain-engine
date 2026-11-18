import { describe, expect, it } from "vitest";
import { insertTrigger, prefixLines, pullTags, wrapMarks } from "@/lib/notes/markers.ts";

describe("wrapMarks", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(wrapMarks("call mom now", 5, 8, "**")).toEqual({
      value: "call **mom** now",
      start: 7,
      end: 10,
    });
  });

  it("puts empty marks at the caret with the caret inside", () => {
    expect(wrapMarks("hi ", 3, 3, "_")).toEqual({ value: "hi __", start: 4, end: 4 });
  });

  it("unwraps a selection that already has the marks", () => {
    expect(wrapMarks("call **mom** now", 7, 10, "**")).toEqual({
      value: "call mom now",
      start: 5,
      end: 8,
    });
  });

  it.each([
    ["inside a word", "snake_case_word", 6, 10, "_", "snake__case__word"],
    ["inside a longer bold run", "***x***", 3, 4, "**", "*****x*****"],
  ])("adds marks instead of unwrapping %s", (_, value, start, end, mark, wrapped) => {
    expect(wrapMarks(value, start, end, mark).value).toBe(wrapped);
  });
});

describe("prefixLines", () => {
  it("adds a list mark to each selected line", () => {
    expect(prefixLines("one\ntwo\nthree", 1, 6, "- ").value).toBe("- one\n- two\nthree");
  });

  it("removes the mark when every line has it", () => {
    expect(prefixLines("- one\n- two", 0, 11, "- ").value).toBe("one\ntwo");
  });

  it("moves the caret with the line", () => {
    expect(prefixLines("a\nbc", 3, 3, "- ")).toEqual({ value: "a\n- bc", start: 5, end: 5 });
  });

  it.each([
    ["a text that starts with a blank line", "\none", 0, 4, "\n- one"],
    ["a whole-line selection that ends after the line break", "one\ntwo", 0, 4, "- one\ntwo"],
    ["blank lines inside the selection", "one\n\ntwo", 0, 8, "- one\n\n- two"],
    ["a caret inside an existing mark", "- one", 1, 1, "one"],
  ])("handles %s", (_, value, start, end, result) => {
    expect(prefixLines(value, start, end, "- ").value).toBe(result);
  });
});

describe("insertTrigger", () => {
  it("adds a space before the trigger after a word", () => {
    expect(insertTrigger("call", 4, 4, "@")).toEqual({ value: "call @", start: 6, end: 6 });
  });

  it("keeps the selection as the query", () => {
    expect(insertTrigger("pay work", 4, 8, "#")).toEqual({ value: "pay #work", start: 9, end: 9 });
  });
});

describe("pullTags", () => {
  it("takes picked tags out of the text", () => {
    expect(pullTags("Pay rent #money soon", ["money", "home"])).toEqual({
      text: "Pay rent soon",
      tags: ["money"],
    });
  });

  it("leaves a tag word that is part of another word", () => {
    expect(pullTags("a#money b", ["money"])).toEqual({ text: "a#money b", tags: [] });
  });

  it("keeps the owner's own double spaces and line breaks", () => {
    expect(pullTags("Pay  rent #money\nsoon", ["money"])).toEqual({
      text: "Pay  rent\nsoon",
      tags: ["money"],
    });
  });
});
