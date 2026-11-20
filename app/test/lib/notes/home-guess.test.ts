import { describe, expect, it } from "vitest";
import { bestHome, homeGuesses } from "@/lib/notes/home-guess.ts";
import { note } from "../../helpers.ts";

const gym = note("places/gym.md", "", { title: "Gym", type: "Place" });
const louis = note("people/louis-martin.md", "", { title: "Louis Martin", type: "Person" });
const lease = note("resources/lease.md", "", { title: "Lease", type: "Note", tags: ["contracts"] });
const notes = [gym, louis, lease];

describe("homeGuesses", () => {
  it("offers subjects named in the text, then tags, by first name for a person", () => {
    const guesses = homeGuesses(notes, "call Louis about the gym contracts fri");
    expect(guesses.map((g) => [g.kind, g.title])).toEqual([
      ["subject", "Gym"],
      ["subject", "Louis Martin"],
      ["tag", "contracts"],
    ]);
  });

  it.each([
    ["a name inside another word", "gymnastics class"],
    ["text too short to guess", "gy"],
    ["a note that is not a subject", "read the lease"],
  ])("offers nothing for %s", (_, text) => {
    expect(homeGuesses(notes, text)).toEqual([]);
  });
});

describe("homeGuesses with no name in the text", () => {
  const cycling = note(
    "topics/cycling.md",
    "# Notes\n\n- 2026-10-02 · The chain skips on the big cog\n- 2026-10-09 · New tyre levers live in the saddle bag\n- 2026-10-20 · Pump the tyre to 80 psi before a long ride\n",
    { title: "Cycling", type: "Topic" },
  );

  it("offers the subject whose lines share the words", () => {
    const guesses = homeGuesses([...notes, cycling], "pump the tyre and oil the chain");
    expect(guesses.map((g) => g.title)).toEqual(["Cycling"]);
  });
});

describe("bestHome", () => {
  it("picks the first subject the text names", () => {
    expect(bestHome(notes, "pay the Gym fee")?.path).toBe("places/gym.md");
  });
});
