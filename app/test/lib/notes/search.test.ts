import { describe, expect, it } from "vitest";
import { buildCard, matchSubject } from "@/lib/notes/subject-card.ts";
import { searchLocal } from "@/lib/notes/search.ts";
import { fixture, NOW, note } from "../../helpers.ts";

describe("local search", () => {
  const notes = [
    ...fixture(),
    note("resources/plan-tips.md", "How to start drafting a plan. Plan your week.", {
      type: "Note",
      title: "Plan tips",
      description: "Drafting basics",
    }),
    note("topics/fit.md", "Nothing about it", {
      type: "Topic",
      title: "Fit for life",
      tags: ["plan"],
    }),
  ];

  it("ranks an exact title above a title match above a body match", () => {
    const hits = searchLocal(notes, "plan");
    expect(hits[0]!.path).toBe("resources/plan-tips.md");
    expect(hits.map((h) => h.path)).toContain("areas/fitness.md");
    expect(hits.findIndex((h) => h.path === "areas/fitness.md")).toBeGreaterThan(0);
    expect(searchLocal(notes, "Alex")[0]!.path).toBe("people/alex.md");
  });

  it("needs every word and finds tags and descriptions", () => {
    expect(searchLocal(notes, "sample plan").map((h) => h.path)).toEqual(["areas/fitness.md"]);
    expect(searchLocal(notes, "drafting basics")[0]!.path).toBe("resources/plan-tips.md");
    expect(searchLocal(notes, "plan").map((h) => h.path)).toContain("topics/fit.md");
    expect(searchLocal(notes, "zzzz")).toEqual([]);
    expect(searchLocal(notes, "   ")).toEqual([]);
  });

  it("shows a snippet from the body and puts archived notes last", () => {
    expect(searchLocal(notes, "drafting")[0]!.snippet).toContain("start drafting");
    const withArchive = [
      ...notes,
      note(".archive/plan.md", "plan plan plan plan plan", { title: "Plan" }),
    ];
    expect(searchLocal(withArchive, "plan").at(-1)!.path).toBe(".archive/plan.md");
  });
});

describe("local card", () => {
  const notes = fixture();

  it("matches a subject by title, people before areas", () => {
    expect(matchSubject(notes, "alex")?.path).toBe("people/alex.md");
    expect(matchSubject(notes, "fit")?.path).toBe("areas/fitness.md");
    expect(matchSubject(notes, "nothing")).toBeUndefined();
  });

  it("builds To do, Next, Lately and People with roles", () => {
    const alex = notes.find((n) => n.path === "people/alex.md")!;
    const card = buildCard(notes, alex, NOW);
    expect(card.todo.map((t) => t.text)).toContain("Follow up on the report");
    expect(buildCard(notes, notes[0]!, NOW).next).toMatchObject({
      date: NOW,
      text: "Make a sample plan",
    });
    expect(card.relations).toContainEqual(
      expect.objectContaining({
        direction: "out",
        title: "Sam",
        role: "sample role",
        time: "since 2020",
        heading: "People",
      }),
    );
    const sam = buildCard(
      notes,
      notes.find((n) => n.path === "people/sam.md")!,
      NOW,
    );
    expect(sam.relations).toContainEqual(
      expect.objectContaining({ direction: "in", title: "Alex" }),
    );
    expect(sam.history[0]!.text).toBe("Sample fact.");
  });
});
