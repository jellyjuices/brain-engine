import { describe, expect, it } from "vitest";
import { whenLabel } from "@/lib/notes/when-label.ts";

const NOW = "2026-11-17";

describe("whenLabel", () => {
  it.each([
    [
      { due: NOW, every: "week" },
      { label: "Every week · Today", status: "today" },
    ],
    [
      { due: "2026-11-24", every: "week" },
      { label: "Every week · Tue", status: "due" },
    ],
    [
      { due: "2026-12-01", every: "month" },
      { label: "Every month · Dec 1", status: "due" },
    ],
    [
      { due: "2026-11-10", every: "week" },
      { label: "Every week · Nov 10", status: "overdue" },
    ],
    [
      { due: "2026-11-20", every: "friday when done" },
      { label: "Every Fri when done · Fri", status: "due" },
    ],
    [{ every: "fri" }, { label: "Every Fri", status: "due" }],
    [{ due: "2026-11-20" }, { label: "Nov 20", status: "due" }],
    [{ due: NOW }, { label: "Today", status: "today" }],
  ])("labels %o", (source, want) => {
    expect(whenLabel(source, NOW)).toEqual(want);
  });

  it("has no label for a to-do with no date and no repeat", () => {
    expect(whenLabel({}, NOW)).toBeUndefined();
  });
});
