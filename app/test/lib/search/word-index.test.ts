import { describe, expect, it } from "vitest";
import { createWordIndex } from "@/lib/search/word-index.ts";
import { note } from "../../helpers.ts";

const shed = note("projects/garden-shed.md", "# Plan\n\n- [ ] Buy cedar boards", {
  title: "Garden shed",
});
const cafe = note("places/corner-cafe.md", "# Notes\n\nGood espresso by the window.", {
  title: "Corner cafe",
});

function idsOf(index: ReturnType<typeof createWordIndex>, path: string): string[] {
  return index
    .entries()
    .filter((entry) => entry.subject === path)
    .map((entry) => entry.id);
}

describe("device word index", () => {
  it("an edit to one note re-reads only that note", () => {
    const index = createWordIndex();
    index.sync([shed, cafe]);
    const cafeEntry = index.entry(idsOf(index, cafe.path)[0]!);
    const edited = { ...shed, body: "# Plan\n\n- [ ] Buy pine boards" };
    expect(index.sync([edited, cafe])).toEqual([shed.path]);
    expect(index.entry(idsOf(index, cafe.path)[0]!)).toBe(cafeEntry);
  });

  it("finds the new words of an edited note and drops the old ones", () => {
    const index = createWordIndex();
    index.sync([shed, cafe]);
    index.sync([{ ...shed, body: "# Plan\n\n- [ ] Buy pine boards" }, cafe]);
    expect(index.words("pine").map((id) => index.entry(id)?.subject)).toEqual([shed.path]);
    expect(index.words("cedar")).toEqual([]);
  });

  it("a copy of an unchanged note is not read again", () => {
    const index = createWordIndex();
    index.sync([shed, cafe]);
    expect(index.sync([{ ...shed }, { ...cafe }])).toEqual([]);
  });

  it("a note gone from the device leaves the index", () => {
    const index = createWordIndex();
    index.sync([shed, cafe]);
    expect(index.sync([cafe])).toEqual([shed.path]);
    expect(index.words("cedar")).toEqual([]);
  });
});
