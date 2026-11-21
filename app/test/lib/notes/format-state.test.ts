import { describe, expect, it } from "vitest";
import { formatState } from "@/lib/notes/format-state.ts";
import { BOLD, ITALIC, parseRich } from "@/lib/notes/rich-text.ts";

describe("formatState", () => {
  it("reads bold and italic from the caret", () => {
    const rich = parseRich("a **b** _c_");
    expect(formatState(rich, null, 3, 3)).toMatchObject({ bold: true, italic: false });
    expect(formatState(rich, null, 5, 5)).toMatchObject({ bold: false, italic: true });
  });

  it("needs the whole selection styled", () => {
    const rich = parseRich("**ab** c");
    expect(formatState(rich, null, 0, 2).bold).toBe(true);
    expect(formatState(rich, null, 0, 4).bold).toBe(false);
  });

  it("uses the next typed style at the caret", () => {
    const rich = parseRich("ab");
    expect(formatState(rich, { at: 2, style: BOLD | ITALIC }, 2, 2)).toMatchObject({
      bold: true,
      italic: true,
    });
  });

  it("reads a list from the caret line", () => {
    const rich = parseRich("- one\ntwo");
    expect(formatState(rich, null, 3, 3).list).toBe(true);
    expect(formatState(rich, null, 7, 7).list).toBe(false);
  });
});
