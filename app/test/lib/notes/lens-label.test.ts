import { describe, expect, it } from "vitest";
import { lensLabel } from "@/lib/notes/lens-label.ts";

describe("lensLabel", () => {
  it.each([
    ["wellbeing", "wellbeing"],
    ["daily-life", "daily life"],
    ["work-and-money", "work and money"],
  ])("%s reads as %s", (slug, label) => {
    expect(lensLabel(slug)).toBe(label);
  });
});
