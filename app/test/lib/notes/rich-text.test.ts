import { describe, expect, it } from "vitest";
import { richSegments } from "@/lib/notes/rich-segments.ts";
import {
  BOLD,
  ITALIC,
  parseRich,
  replaceText,
  richMarkdown,
  toggleStyle,
  type Rich,
} from "@/lib/notes/rich-text.ts";

const none = { names: [], tags: [] };

function plain(text: string): Rich {
  return { text, styles: Array.from({ length: text.length }, () => 0) };
}

describe("richMarkdown", () => {
  it.each([
    ["**Call mom** now", "**Call mom** now"],
    ["Call _mom_ now", "Call _mom_ now"],
    ["**_Pay rent_**", "**_Pay rent_**"],
    ["Pay **rent**\nCall _mom_", "Pay **rent**\nCall _mom_"],
  ])("writes %s back the same after a parse", (markdown, saved) => {
    expect(richMarkdown(parseRich(markdown))).toBe(saved);
  });

  it("keeps spaces at the edge of a bold run outside the stars", () => {
    const rich = toggleStyle(plain("Call mom now"), 4, 9, BOLD).rich;
    expect(richMarkdown(rich)).toBe("Call **mom** now");
  });

  it("uses stars for italic inside a word so it still reads as italic", () => {
    const rich = toggleStyle(plain("grandma"), 5, 7, ITALIC).rich;
    expect(richMarkdown(rich)).toBe("grand*ma*");
  });

  it("keeps a list dash outside the bold", () => {
    const rich = toggleStyle(plain("- milk"), 0, 6, BOLD).rich;
    expect(richMarkdown(rich)).toBe("- **milk**");
  });
});

describe("toggleStyle", () => {
  it("bolds the whole word at a caret", () => {
    expect(richMarkdown(toggleStyle(plain("Call mom now"), 6, 6, BOLD).rich)).toBe(
      "Call **mom** now",
    );
  });

  it("takes bold off a selection that is all bold", () => {
    const rich = parseRich("**Call mom**");
    expect(richMarkdown(toggleStyle(rich, 5, 8, BOLD).rich)).toBe("**Call** mom");
  });

  it("bolds all of a selection that is only part bold", () => {
    const rich = parseRich("**Call** mom");
    expect(richMarkdown(toggleStyle(rich, 0, 8, BOLD).rich)).toBe("**Call mom**");
  });

  it("leaves the text alone on a caret with no word", () => {
    const rich = plain("Call  ");
    expect(toggleStyle(rich, 5, 5, BOLD).rich).toBe(rich);
  });
});

describe("replaceText", () => {
  it("gives typed letters the style of the letter before", () => {
    expect(richMarkdown(replaceText(parseRich("**Call**"), "Call mom"))).toBe("**Call mom**");
  });

  it("gives typed letters the asked style", () => {
    expect(richMarkdown(replaceText(plain("Call "), "Call mom", BOLD))).toBe("Call **mom**");
  });

  it("starts a new line plain", () => {
    const broken = replaceText(parseRich("**Call**"), "Call\n");
    expect(richMarkdown(replaceText(broken, "Call\nmom"))).toBe("**Call**\nmom");
  });

  it("keeps the style of letters after a delete", () => {
    expect(richMarkdown(replaceText(parseRich("Call **mom**"), "Cal mom"))).toBe("Cal **mom**");
  });
});

describe("richSegments", () => {
  it("draws bold letters with no marks around them", () => {
    expect(richSegments(parseRich("Call **mom**"), none)).toEqual([
      { text: "Call ", marks: [] },
      { text: "mom", marks: ["bold"] },
    ]);
  });

  it("marks a picked name inside bold as both", () => {
    const segs = richSegments(parseRich("**Call @Aisha**"), { names: ["Aisha"], tags: [] });
    expect(segs[1]).toEqual({ text: "@Aisha", marks: ["bold", "mention"] });
  });

  it("draws a line dash as a bullet only for lists", () => {
    expect(richSegments(plain("- milk"), none)[0]).toEqual({ text: "- ", marks: ["bullet"] });
    expect(richSegments(plain("- milk"), none, false)[0]).toEqual({ text: "- milk", marks: [] });
  });
});
