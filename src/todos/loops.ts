// To-dos live as checklist lines inside the note they belong to: an area, a project or a person.
// A capture is temporary. Once it is sorted, `absorb` moves its text into its subject note and archives it.
//
//   # To-dos
//   - [ ] Chase the pending MRI · due 2026-11-07 · today
//   - [ ] File Toronto expenses · due 2026-11-08
//   - [x] Book a dentist · done 2026-11-10
//   - [ ] Pay rent · due 2026-12-01 · every month
//
// A repeat rule is plain words, not cron: `every day|week|month|year`, `every 2 weeks`, `every mon`,
// `every weekday`, `every month on the 1st`. Add `when done` to count from the day it was done, not the due date.
// DECISION: words over cron or RRULE. Cron has no "every 2 weeks" and nobody can read it in a note.
// When a repeating loop is done, it is ticked and a new open line with the next due date goes under it.
//
//   # Notes
//   - 2026-11-04 · Started studying Japanese again.

import { DIRS, extractLinks, folderOf, type Note, str, type Summary, titleOf, today } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { nextDue, parseEvery } from "./repeat.ts";

export const LOOPS_HEADING = "# To-dos";
const OLD_LOOPS_HEADING = "# Open loops";
export const NOTES_HEADING = "# Notes";
export const OUTCOMES = ["today", "someday", "waiting"];
// DECISION: notes written before 2026-11-07 used do-now, schedule, park and hand-off. Read them as the new words.
const OLD_OUTCOMES: Record<string, string | undefined> = { "do-now": "today", schedule: undefined, park: "someday", "hand-off": "waiting" };

/** The When token to write on a to-do line, from a new or old word. A date needs no token. */
export function toOutcome(word: string | undefined): string | undefined {
  if (!word) return undefined;
  return OUTCOMES.includes(word) ? word : OLD_OUTCOMES[word];
}
const SEP = " · ";

/** The word the owner sees for a stored When token. */
export const whenWord = (outcome: string | undefined): string | undefined => (outcome ? ({ waiting: "waiting on someone" } as Record<string, string>)[outcome] ?? outcome : undefined);

export interface Loop {
  path: string; // the note that holds it
  text: string;
  done: boolean;
  due?: string;
  outcome?: string;
  doneAt?: string;
  every?: string;
  /** Ticked because the owner dropped it, not because it was done. */
  dropped?: boolean;
  /** `· with [Person](...)` parts, kept as written. */
  with?: string[];
  /** `· re [Subject](...)` parts, kept as written. */
  re?: string[];
  /** Notes this to-do names in its with and re parts, as brain-relative paths. Set by loopsIn. */
  subjects?: string[];
  noteTitle: string;
  area?: string;
}

const LINKED = /^(with|re) (\[[^\]]*\]\([^)\s]+\))$/;

export function parseLoopLine(line: string): Omit<Loop, "path" | "noteTitle" | "area"> | null {
  const match = line.match(/^- \[( |x|X)\] (.+)$/);
  if (!match) return null;
  const [text, ...tokens] = match[2].split(SEP);
  const loop: Omit<Loop, "path" | "noteTitle" | "area"> = { text: text.trim(), done: match[1] !== " " };
  const extra: string[] = [];
  for (const t of tokens.map((x) => x.trim())) {
    const due = t.match(/^due (\d{4}-\d{2}-\d{2})$/);
    const done = t.match(/^done (\d{4}-\d{2}-\d{2})$/);
    if (due) loop.due = due[1];
    else if (done) loop.doneAt = done[1];
    else if (parseEvery(t)) loop.every = t.slice(6).trim();
    else if (OUTCOMES.includes(t) || t in OLD_OUTCOMES) {
      const outcome = toOutcome(t);
      if (outcome) loop.outcome = outcome;
    }
    else if (t === "dropped") loop.dropped = true;
    else if (LINKED.test(t)) {
      const [, kind, link] = t.match(LINKED)!;
      (loop[kind as "with" | "re"] ??= []).push(link);
    } else extra.push(t);
  }
  if (extra.length) loop.text = [loop.text, ...extra].join(SEP);
  return loop;
}

export function formatLoop(l: { text: string; done?: boolean; due?: string; outcome?: string; doneAt?: string; every?: string; with?: string[]; re?: string[]; dropped?: boolean }): string {
  const text = l.text.replace(/\s*\n\s*/g, " ").replaceAll(SEP, " - ").trim();
  const tokens = [...(l.with ?? []).map((x) => `with ${x}`), ...(l.re ?? []).map((x) => `re ${x}`), l.due && `due ${l.due}`, l.every && `every ${l.every}`, l.outcome, l.done && `done ${l.doneAt ?? today()}`, l.dropped && "dropped"].filter(Boolean);
  return `- [${l.done ? "x" : " "}] ${[text, ...tokens].join(SEP)}`;
}

/** The lines of one top-level section ("# Heading"), as [start, end) line numbers of its content. */
export function sectionRange(lines: string[], heading: string): [number, number] | null {
  const headingIndex = lines.findIndex((l) => l.trim() === heading);
  if (headingIndex === -1) return null;
  let end = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) if (/^# /.test(lines[i])) { end = i; break; }
  return [headingIndex + 1, end];
}

/** The note's area: its `area` field, or its own slug when it is an area note. */
export function areaOf(n: Note): string | undefined {
  return str(n.meta.area) ?? (n.path.startsWith("areas/") ? n.path.slice(6, -3) : undefined);
}

export function loopsIn(n: Note): Loop[] {
  const lines = n.body.split("\n");
  const range = sectionRange(lines, LOOPS_HEADING) ?? sectionRange(lines, OLD_LOOPS_HEADING);
  if (!range) return [];
  const out: Loop[] = [];
  for (let i = range[0]; i < range[1]; i++) {
    const todo = parseLoopLine(lines[i]);
    if (!todo) continue;
    const subjects = [...(todo.with ?? []), ...(todo.re ?? [])].flatMap((x) => extractLinks(n.path, x));
    out.push({ ...todo, ...(subjects.length && { subjects }), path: n.path, noteTitle: titleOf(n), area: areaOf(n) });
  }
  return out;
}

export const live = (n: Note) => folderOf(n) !== DIRS.archive && str(n.meta.status) !== "deprecated";

export function allLoops(notes: Note[], opts: { done?: boolean } = {}): Loop[] {
  return notes.filter(live).flatMap(loopsIn).filter((l) => opts.done === undefined || l.done === opts.done);
}

/** A loop shaped like a note summary, so reports and menus can list both the same way. */
export function loopSummary(l: Loop): Summary {
  return { path: l.path, type: "Loop", title: l.text, description: l.noteTitle, tags: [], area: l.area, status: "stable", due: l.due, outcome: l.outcome, modified: today() };
}

/** Add a line at the end of a section. Makes the section at the end of the body if it is missing. */
export function appendToSection(body: string, heading: string, line: string): string {
  const lines = body.replace(/\s+$/, "").split("\n");
  const range = sectionRange(lines, heading);
  if (!range) return `${lines.join("\n")}\n\n${heading}\n\n${line}\n`;
  let at = range[1];
  while (at > range[0] && lines[at - 1].trim() === "") at--;
  const blankAfterHeading = at === range[0];
  lines.splice(at, 0, ...(blankAfterHeading ? ["", line] : [line]));
  return lines.join("\n") + "\n";
}

export function addLoop(root: string, rel: string, l: { text: string; due?: string; outcome?: string; every?: string; with?: string[]; re?: string[] }): Note {
  const note = readNote(root, rel);
  return writeNote(root, rel, note.meta, appendToSection(note.body, LOOPS_HEADING, formatLoop(l)));
}

export function addNoteLine(root: string, rel: string, text: string, date = today()): Note {
  const note = readNote(root, rel);
  const line = `- ${date}${SEP}${text.replace(/\s*\n\s*/g, " ").trim()}`;
  return writeNote(root, rel, note.meta, appendToSection(note.body, NOTES_HEADING, line));
}

/** Tick off the first open loop whose text contains the words. */
export function completeLoop(root: string, words: string): Loop & { next?: string } {
  const needle = words.toLowerCase().trim();
  if (!needle) throw new Error("Say which to-do: brain done \"words from it\"");
  const hits = allLoops(loadAll(root), { done: false }).filter((l) => l.text.toLowerCase().includes(needle));
  if (!hits.length) throw new Error(`No open to-do matches "${words}".`);
  if (hits.length > 1 && !hits.every((h) => h.text === hits[0].text)) {
    throw new Error(`${hits.length} to-dos match "${words}". Use more words:\n${hits.map((h) => `  ${h.text}  (${h.path})`).join("\n")}`);
  }
  const hit = hits[0];
  const note = readNote(root, hit.path);
  const lines = note.body.split("\n");
  const i = lines.findIndex((line) => {
    const todo = parseLoopLine(line);
    return todo && !todo.done && todo.text === hit.text;
  });
  lines[i] = formatLoop({ ...hit, done: true, doneAt: today(), every: undefined });
  let next: string | undefined;
  if (hit.every) {
    next = nextDue(hit.every, hit.due ?? today());
    lines.splice(i + 1, 0, formatLoop({ text: hit.text, due: next, every: hit.every, outcome: hit.outcome, with: hit.with, re: hit.re }));
  }
  writeNote(root, hit.path, note.meta, lines.join("\n"));
  log(root, `done: ${hit.text} (${hit.path})${next ? `, next due ${next}` : ""}`);
  return { ...hit, done: true, doneAt: today(), next };
}
