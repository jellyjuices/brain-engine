import { describe, expect, it } from "vitest";
import { buildCard, matchSubject } from "@/lib/notes/subject-card.ts";
import { searchLocal } from "@/lib/notes/search.ts";
import { fixture, NOW, note } from "../../helpers.ts";

describe("local search", () => {
  const notes = [
    ...fixture(),
    note("resources/gym-tips.md", "How to start lifting at the gym. Plan your week.", {
      type: "Note",
      title: "Gym tips",
      description: "Lifting basics",
    }),
    note("topics/fit.md", "Nothing about it", {
      type: "Topic",
      title: "Fit for life",
      tags: ["gym"],
    }),
  ];

  it("ranks an exact title above a title match above a body match", () => {
    const hits = searchLocal(notes, "gym");
    expect(hits[0]!.path).toBe("resources/gym-tips.md");
    expect(hits.map((h) => h.path)).toContain("areas/fitness.md");
    expect(hits.findIndex((h) => h.path === "areas/fitness.md")).toBeGreaterThan(0);
    expect(searchLocal(notes, "Aisha")[0]!.path).toBe("people/aisha.md");
  });

  it("needs every word and finds tags and descriptions", () => {
    expect(searchLocal(notes, "gym schedule").map((h) => h.path)).toEqual(["areas/fitness.md"]);
    expect(searchLocal(notes, "lifting basics")[0]!.path).toBe("resources/gym-tips.md");
    expect(searchLocal(notes, "gym").map((h) => h.path)).toContain("topics/fit.md");
    expect(searchLocal(notes, "zzzz")).toEqual([]);
    expect(searchLocal(notes, "   ")).toEqual([]);
  });

  it("shows a snippet from the body and puts archived notes last", () => {
    expect(searchLocal(notes, "lifting")[0]!.snippet).toContain("start lifting");
    const withArchive = [
      ...notes,
      note(".archive/gym.md", "gym gym gym gym gym", { title: "Gym" }),
    ];
    expect(searchLocal(withArchive, "gym").at(-1)!.path).toBe(".archive/gym.md");
  });
});

describe("local card", () => {
  const notes = fixture();

  it("matches a subject by title, people before areas", () => {
    expect(matchSubject(notes, "aisha")?.path).toBe("people/aisha.md");
    expect(matchSubject(notes, "fit")?.path).toBe("areas/fitness.md");
    expect(matchSubject(notes, "nothing")).toBeUndefined();
  });

  it("builds To do, Next, Lately and People with roles", () => {
    const aisha = notes.find((n) => n.path === "people/aisha.md")!;
    const card = buildCard(notes, aisha, NOW);
    expect(card.todo.map((t) => t.text)).toContain("Follow up on the invoice");
    expect(buildCard(notes, notes[0]!, NOW).next).toMatchObject({
      date: NOW,
      text: "Make a gym schedule",
    });
    expect(card.relations).toContainEqual(
      expect.objectContaining({
        direction: "out",
        title: "Em",
        role: "sister",
        time: "since 2020",
        heading: "People",
      }),
    );
    const em = buildCard(
      notes,
      notes.find((n) => n.path === "people/em.md")!,
      NOW,
    );
    expect(em.relations).toContainEqual(
      expect.objectContaining({ direction: "in", title: "Aisha" }),
    );
    expect(em.history[0]!.text).toBe("Likes tea.");
  });
});
