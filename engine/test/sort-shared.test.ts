import { test } from "node:test";
import assert from "node:assert/strict";
import type { Entry, Hit } from "../shared/search/index.ts";
import { guessHome, sortWords, subjectsNamed, type SortSubject } from "../shared/sort/index.ts";

const subject = (path: string, type: string, title: string, aliases: string[] = []): SortSubject => ({ path, type, title, aliases });

const garden = subject("projects/garden.md", "Project", "Garden beds", ["veg patch"]);
const pat = subject("people/pat.md", "Person", "Pat Rivers");
const house = subject("areas/house.md", "Area", "House");
const bikes = subject("topics/bikes.md", "Topic", "Bikes");
const subjects = [garden, pat, house, bikes];

const hit = (subjectPath: string, id: string, score: number): Hit => ({
  entry: { id, hash: id, kind: "dated", subject: subjectPath, title: "", names: [], date: null, done: null, line: 1, text: "", embedText: "" } satisfies Entry,
  score,
  tier: 3,
});

test("a named subject wins and is sure", () => {
  const guess = guessHome("water the veg patch", subjects, []);
  assert.deepEqual(guess, { into: garden.path, how: "named", sure: true, people: [], re: [] });
});

test("a subject beats a person, and the person becomes with", () => {
  const guess = guessHome("ask Pat about the garden beds", subjects, []);
  assert.equal(guess.into, garden.path);
  assert.deepEqual(guess.people, [pat.path]);
});

test("a person alone is the home, but unsure", () => {
  assert.deepEqual(guessHome("call Pat", subjects, []), { into: pat.path, how: "named", sure: false, people: [], re: [] });
});

test("a name only counts as whole words", () => {
  assert.deepEqual(subjectsNamed(subjects, "housekeeping list"), []);
});

test("with no name, the nearest subject wins and is sure when far ahead", () => {
  const hits = [hit(bikes.path, "a", 0.03), hit(bikes.path, "b", 0.02), hit(bikes.path, "c", 0.02), hit(house.path, "d", 0.01), hit(house.path, "e", 0.005)];
  const guess = guessHome("fix the flat tyre", subjects, hits);
  assert.deepEqual(guess, { into: bikes.path, how: "near", sure: true, people: [], re: [] });
});

test("a close second makes the nearest guess unsure", () => {
  const hits = [hit(bikes.path, "a", 0.02), hit(bikes.path, "b", 0.02), hit(bikes.path, "c", 0.01), hit(house.path, "d", 0.02), hit(house.path, "e", 0.02)];
  assert.equal(guessHome("oil the chain", subjects, hits).sure, false);
});

test("one stray hit or a hit outside the subjects is no guess", () => {
  const hits = [hit(bikes.path, "a", 0.05), hit("journal/2026-11-01.md", "b", 0.05), hit("journal/2026-11-01.md", "c", 0.05)];
  assert.deepEqual(guessHome("something new", subjects, hits), { into: null, how: "none", sure: false, people: [], re: [] });
});

test("sort words drop short and common words", () => {
  assert.deepEqual(sortWords("Tomorrow: pump the tyre and oil it"), ["pump", "tyre", "oil"]);
});
