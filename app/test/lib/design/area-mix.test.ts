import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { mixGradient, mixSplit, splitAreas } from "@/lib/design/area-mix.ts";

const six = ["health", "fitness", "money", "home", "career", "love-life"];

describe("splitAreas", () => {
  const cases: [string[], { shown: string[]; extra: number }][] = [
    [["health"], { shown: ["health"], extra: 0 }],
    [["health", "fitness"], { shown: ["health", "fitness"], extra: 0 }],
    [["health", "fitness", "money"], { shown: ["health", "fitness", "money"], extra: 0 }],
    [six, { shown: ["health", "fitness", "money"], extra: 3 }],
    [["health", "health", "fitness"], { shown: ["health", "fitness"], extra: 0 }],
  ];

  it.each(cases)("splits %j into %j", (areas, expected) =>
    assert.deepEqual(splitAreas(areas), expected),
  );
});

describe("mixes for many areas", () => {
  it("splits a small part into at most three bands", () => {
    assert.equal(mixSplit(six).match(/var\(--area-/g)?.length, 3);
  });

  it("blends at most three key colours in a gradient", () => {
    assert.equal(mixGradient(six).match(/oklch\(from /g)?.length, 3);
  });

  it("raises the chroma of each fill when two areas share a gradient", () => {
    assert.equal(
      mixGradient(["health", "fitness"], "fill", 90),
      "linear-gradient(in oklch 90deg, " +
        "color-mix(in oklch, var(--area-health-fill), oklch(from var(--area-health-fill) l 0.3 h) 35%), " +
        "color-mix(in oklch, var(--area-fitness-fill), oklch(from var(--area-fitness-fill) l 0.3 h) 35%))",
    );
  });

  it("leaves the glow role as it is", () => {
    assert.equal(
      mixGradient(["health", "fitness"], "glow", 90),
      "linear-gradient(in oklch 90deg, var(--area-health-glow), var(--area-fitness-glow))",
    );
  });

  it("gives one area a flat gradient of its own colour", () => {
    assert.equal(
      mixGradient(["health"], "fill", 90),
      "linear-gradient(in oklch 90deg, var(--area-health-fill), var(--area-health-fill))",
    );
  });
});
