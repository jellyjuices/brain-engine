import { describe, expect, it } from "vitest";
import { dayInText } from "@/lib/notes/when-word.ts";

const thursday = "2026-11-19";

describe("dayInText", () => {
  it.each([
    ["call Riley fri", "2026-11-20"],
    ["call Riley on Thursday", "2026-11-26"],
    ["send it tomorrow", "2026-11-20"],
    ["book it next week", "2026-11-23"],
    ["due 2026-12-01", "2026-12-01"],
    ["book the dentist", null],
    ["fried rice", null],
    ["we sat down at the sun deck", null],
    ["lunch on Saturday", "2026-11-21"],
    ["call Wednesday", "2026-11-25"],
  ])("reads %s as %s", (text, day) => {
    expect(dayInText(text, thursday)).toBe(day);
  });
});
