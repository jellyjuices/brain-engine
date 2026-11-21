import { describe, expect, it } from "vitest";
import type { StoredNote } from "@/lib/notes/model.ts";
import {
  findTrigger,
  mentionSuggestions,
  replaceTrigger,
  tagSuggestions,
} from "@/lib/notes/mention.ts";
import { note } from "../../helpers.ts";

function person(path: string, title: string): StoredNote {
  return note(path, "", { title, type: "Person" });
}

describe("findTrigger", () => {
  it("finds @ and # after a space or at the start", () => {
    expect(findTrigger("call @Al", 8)).toEqual({ kind: "mention", start: 5, query: "Al" });
    expect(findTrigger("#mon", 4)).toEqual({ kind: "tag", start: 0, query: "mon" });
    expect(findTrigger("see @", 5)).toEqual({ kind: "mention", start: 4, query: "" });
  });
  it("lets a name have one space", () => {
    expect(findTrigger("@Alex Ph", 8)?.query).toBe("Alex Ph");
  });
  it("ignores emails, headings, other lines and tags with spaces", () => {
    expect(findTrigger("ab@mail", 7)).toBeNull();
    expect(findTrigger("# Notes", 7)).toBeNull();
    expect(findTrigger("## ", 3)).toBeNull();
    expect(findTrigger("@Al\nnext", 8)).toBeNull();
    expect(findTrigger("@Alex  x", 8)).toBeNull();
  });
});

describe("mentionSuggestions", () => {
  const notes = [
    person("people/alex.md", "Alex Sample"),
    person("people/lucia.md", "Lucia Alexova"),
    { ...person("groups/x.md", "Alex club"), type: "Group" },
    { ...person(".archive/old.md", "Alex old") },
  ];
  it("lists live subjects that match, names that start with the words first", () => {
    const got = mentionSuggestions(notes, "areas/fitness.md", "2026-11-07", "ale");
    expect(got.map((s) => s.title)).toEqual(["Alex club", "Alex Sample", "Lucia Alexova"]);
    expect(got[1]!.value).toBe("[Alex Sample](../people/alex.md)");
  });
  it("offers dates as ISO days", () => {
    const got = mentionSuggestions(notes, "areas/fitness.md", "2026-11-07", "tom");
    expect(got).toEqual([expect.objectContaining({ kind: "date", value: "2026-11-08" })]);
    const today = mentionSuggestions([], "a.md", "2026-11-07", "tod");
    expect(today[0]!.value).toBe("2026-11-07");
  });
});

describe("tagSuggestions", () => {
  it("skips tags the note has", () => {
    const got = tagSuggestions(["home", "money", "health"], ["home"], "h");
    expect(got.map((s) => s.value)).toEqual(["health"]);
  });
});

describe("replaceTrigger", () => {
  it("swaps the typed words for the pick and adds a space", () => {
    const t = { kind: "mention" as const, start: 5, query: "Al" };
    expect(replaceTrigger("call @Al", t, 8, "[Alex](a.md)")).toEqual({
      value: "call [Alex](a.md) ",
      caret: 18,
    });
  });
  it("removes a tag's words without a double space", () => {
    const t = { kind: "tag" as const, start: 4, query: "mo" };
    expect(replaceTrigger("buy #mo now", t, 7, "")).toEqual({ value: "buy now", caret: 4 });
  });
});
