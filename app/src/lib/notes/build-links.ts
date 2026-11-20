import { subjectsNamed } from "./home-guess.ts";
import { isLive, type StoredNote } from "./model.ts";
import { SUBJECT_TYPES } from "./types.ts";

export interface NamingNote {
  note: StoredNote;
  line: string;
  todo: boolean;
}

const SUGGEST = 4;

function linksTo(n: StoredNote, path: string): boolean {
  const file = path.split("/").pop() ?? path;
  return n.body.includes(file);
}

export function namingNotes(notes: StoredNote[], built: StoredNote): NamingNote[] {
  const out: NamingNote[] = [];
  for (const n of notes) {
    if (n.path === built.path || !isLive(n) || n.path.startsWith("inbox/")) continue;
    if (linksTo(n, built.path)) continue;
    const line = n.body.split("\n").find((l) => subjectsNamed([built], l).length > 0);
    if (!line) continue;
    const todo = /^\s*- \[ \]/.test(line);
    out.push({ note: n, line: line.replace(/^\s*-\s*(\[.\]\s*)?/, "").trim(), todo });
  }
  return out;
}

export function subjectChoices(
  notes: StoredNote[],
  built: StoredNote,
): { suggested: StoredNote[]; rest: StoredNote[] } {
  const counts = new Map<string, number>();
  for (const hit of namingNotes(notes, built)) {
    for (const s of subjectsNamed(notes, hit.line)) {
      if (s.path !== built.path) counts.set(s.path, (counts.get(s.path) ?? 0) + 1);
    }
    if (SUBJECT_TYPES.includes(hit.note.type ?? ""))
      counts.set(hit.note.path, (counts.get(hit.note.path) ?? 0) + 1);
  }
  const subjects = notes
    .filter((n) => SUBJECT_TYPES.includes(n.type ?? "") && isLive(n) && n.path !== built.path)
    .sort((a, b) => a.title.localeCompare(b.title));
  const suggested = subjects
    .filter((n) => counts.has(n.path))
    .sort((a, b) => (counts.get(b.path) ?? 0) - (counts.get(a.path) ?? 0))
    .slice(0, SUGGEST);
  return { suggested, rest: subjects.filter((n) => !suggested.includes(n)) };
}
