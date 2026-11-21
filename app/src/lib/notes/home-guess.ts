import { subjectsNamed as namedIn } from "@shared/sort/index.ts";
import { deviceSubjects, sortOnDevice } from "@/lib/search/sort-on-device.ts";
import { tagsInUse } from "./capture.ts";
import type { StoredNote } from "./model.ts";
import type { Suggestion } from "./mention.ts";

const LIMIT = 3;
const MIN_LETTERS = 3;
const MIN_NAME = 3;

function settled(text: string): string {
  return text.replace(/[\p{L}\p{N}'-]+$/u, "");
}

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) ?? []);
}

function byPaths(notes: readonly StoredNote[], paths: readonly string[]): StoredNote[] {
  const byPath = new Map(notes.map((n) => [n.path, n]));
  return paths.flatMap((path) => byPath.get(path) ?? []);
}

export function subjectsNamed(notes: StoredNote[], text: string): StoredNote[] {
  return byPaths(
    notes,
    namedIn(deviceSubjects(notes), text).map((s) => s.path),
  );
}

export function homeGuesses(notes: StoredNote[], text: string): Suggestion[] {
  const done = settled(text);
  if (done.replace(/\W/g, "").length < MIN_LETTERS) return [];
  const guess = sortOnDevice(done, notes, MIN_NAME);
  const clear = guess.how === "named" || (guess.how === "near" && guess.sure);
  const paths = guess.into && clear ? [guess.into, ...guess.re, ...guess.people] : [];
  const subjects: Suggestion[] = byPaths(notes, paths).map((n) => ({
    key: n.path,
    kind: "subject",
    type: n.type,
    title: n.title,
    value: n.path,
  }));
  const said = words(done);
  const tags: Suggestion[] = tagsInUse(notes)
    .filter((t) => t.length >= MIN_LETTERS && said.has(t.toLowerCase()))
    .map((t) => ({ key: `tag:${t}`, kind: "tag", title: t, value: t }));
  return [...subjects, ...tags].slice(0, LIMIT);
}

export function bestHome(notes: StoredNote[], text: string): StoredNote | undefined {
  const into = sortOnDevice(text, notes).into;
  return into ? byPaths(notes, [into])[0] : undefined;
}
