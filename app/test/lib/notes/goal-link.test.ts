import { describe, expect, it } from "vitest";
import { goalLink, openTodoPicks, towardIn } from "@/lib/notes/goal-link.ts";
import { fixture } from "../../helpers.ts";

const goal = { path: "goals/sample-goal.md", title: "Sample goal" };

describe("openTodoPicks", () => {
  it("lists each open to-do with its note", () => {
    const picks = openTodoPicks(fixture());
    expect(picks).toContainEqual({
      key: "areas/fitness.md::Buy a sample item",
      text: "Buy a sample item",
      path: "areas/fitness.md",
      noteTitle: "Fitness",
    });
    expect(picks.some((p) => p.text === "Book a sample visit")).toBe(false);
  });
});

describe("openTodoPicks for a goal", () => {
  it("leaves out a to-do that already points at that goal", () => {
    const notes = fixture().map((n) =>
      n.path === "areas/fitness.md"
        ? {
            ...n,
            body: n.body.replace(
              "Buy a sample item",
              "Buy a sample item · toward [Sample goal](../goals/sample-goal.md)",
            ),
          }
        : n,
    );
    const texts = openTodoPicks(notes, goal.path).map((p) => p.text);
    expect(texts).not.toContain("Buy a sample item");
    expect(openTodoPicks(notes).map((p) => p.text)).toContain("Buy a sample item");
  });
});

describe("goalLink", () => {
  it("links to the goal from the note's own folder", () => {
    expect(goalLink("areas/fitness.md", goal)).toBe("[Sample goal](../goals/sample-goal.md)");
    expect(goalLink("goals/other.md", goal)).toBe("[Sample goal](sample-goal.md)");
  });
});

describe("towardIn", () => {
  const body = "# To-dos\n\n- [ ] Buy a sample item · due 2026-11-09\n- [ ] Other\n";

  it("adds the goal to the matching open to-do and leaves the rest", () => {
    expect(towardIn(body, "Buy a sample item", "areas/fitness.md", goal)).toBe(
      "# To-dos\n\n- [ ] Buy a sample item · toward [Sample goal](../goals/sample-goal.md) · due 2026-11-09\n- [ ] Other\n",
    );
  });

  it("keeps a goal the to-do already points to", () => {
    const first = towardIn(body, "Other", "areas/fitness.md", goal)!;
    const second = towardIn(first, "Other", "areas/fitness.md", {
      path: "goals/run.md",
      title: "Run",
    });
    expect(second).toContain("toward [Sample goal](../goals/sample-goal.md)");
    expect(second).toContain("toward [Run](../goals/run.md)");
  });

  it("returns null when the to-do is not there", () => {
    expect(towardIn(body, "Gone", "areas/fitness.md", goal)).toBeNull();
  });
});
