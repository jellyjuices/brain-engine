import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { percentOf } from "@/lib/design/percent.ts";

describe("percentOf", () => {
  const cases: [number, number, number][] = [
    [5, 12, 42],
    [0, 12, 0],
    [12, 12, 100],
    [14, 12, 100],
    [3, 0, 0],
  ];

  it.each(cases)("%i of %i is %i%%", (done, total, expected) =>
    assert.equal(percentOf(done, total), expected),
  );
});
