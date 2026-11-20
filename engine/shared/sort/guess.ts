import { subjectsNamed } from "./names.ts";
import { nearSubjects, sureOf } from "./near.ts";
import type { SortGuess, SortHits, SortSubject } from "./types.ts";

const NONE: SortGuess = { into: null, how: "none", sure: false, people: [], re: [] };

const isPerson = (subject: SortSubject) => subject.type === "Person";

function fromNames(named: SortSubject[]): SortGuess {
  const home = named.find((subject) => !isPerson(subject)) ?? named[0]!;
  const others = named.filter((subject) => subject !== home);
  return {
    into: home.path,
    how: "named",
    sure: !isPerson(home),
    people: others.filter(isPerson).map((subject) => subject.path),
    re: others.filter((subject) => !isPerson(subject)).map((subject) => subject.path),
  };
}

export function guessHome(text: string, subjects: readonly SortSubject[], hits: SortHits): SortGuess {
  if (!text.trim()) return NONE;
  const named = subjectsNamed(subjects, text);
  if (named.length) return fromNames(named);
  const [top, next] = nearSubjects(hits, new Set(subjects.map((subject) => subject.path)));
  if (!top) return NONE;
  return { into: top.path, how: "near", sure: sureOf(top, next), people: [], re: [] };
}
