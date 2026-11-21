import { describe, expect, it } from "vitest";
import { bestHome, homeGuesses } from "@/lib/notes/home-guess.ts";
import { note } from "../../helpers.ts";

const depot = note("places/depot.md", "", { title: "Depot", type: "Place" });
const riley = note("people/riley-chen.md", "", { title: "Riley Chen", type: "Person" });
const terms = note("resources/terms.md", "", { title: "Terms", type: "Note", tags: ["contracts"] });
const notes = [depot, riley, terms];

describe("homeGuesses", () => {
  it("offers subjects named in the text, then tags, by first name for a person", () => {
    const guesses = homeGuesses(notes, "call Riley about the depot contracts fri ");
    expect(guesses.map((g) => [g.kind, g.title])).toEqual([
      ["subject", "Depot"],
      ["subject", "Riley Chen"],
      ["tag", "contracts"],
    ]);
  });

  it.each([
    ["a name inside another word", "depotic class"],
    ["text too short to guess", "de"],
    ["a note that is not a subject", "read the terms"],
  ])("offers nothing for %s", (_, text) => {
    expect(homeGuesses(notes, text)).toEqual([]);
  });
});

describe("homeGuesses with no name in the text", () => {
  const machines = note(
    "topics/machines.md",
    "# Notes\n\n- 2026-10-02 · The gear skips on the big cog\n- 2026-10-09 · New valve levers live in the toolbox\n- 2026-10-20 · Pump the valve to 80 psi before a long run\n",
    { title: "Machines", type: "Topic" },
  );

  it("offers the subject whose lines share the words", () => {
    const guesses = homeGuesses([...notes, machines], "pump the valve and oil the gear ");
    expect(guesses.map((g) => g.title)).toEqual(["Machines"]);
  });

  it("offers nothing when only one word is shared", () => {
    expect(homeGuesses([...notes, machines], "buy a valve today ")).toEqual([]);
  });

  it("ignores the word still being typed", () => {
    expect(homeGuesses(notes, "pay the depo")).toEqual([]);
    expect(homeGuesses(notes, "pay the depot")).toEqual([]);
    expect(homeGuesses(notes, "pay the depot ").map((g) => g.title)).toEqual(["Depot"]);
  });

  it("ignores names shorter than three letters", () => {
    const al = note("people/al.md", "", { title: "Al", type: "Person" });
    expect(homeGuesses([al], "ask al about the plan ")).toEqual([]);
  });
});

describe("bestHome", () => {
  it("picks the first subject the text names", () => {
    expect(bestHome(notes, "pay the Depot fee")?.path).toBe("places/depot.md");
  });
});
