// The journal day note, journal/YYYY-MM-DD.md. Each entry stays whole under its time heading.
// DECISION: a mark line under the heading says if the entry waits: "· to sort", then "· sorted <date>".
// The heading never changes, so the anchor a sorted bit links back to stays good.

import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { type Meta, type Note, nowStamp, today, typeOf } from "../core/notes.ts";
import { readNote, writeNote } from "../core/files.ts";
import { changeFiles } from "../core/log.ts";
import { isOwnerWriter } from "../core/owner.ts";
import { newNote } from "./actions.ts";
import { fileInto, type SortBit } from "./file.ts";

export const JOURNAL_HEADING = "# Journal";
export const WAITING = "· to sort";
const SORTED = /^· sorted \d{4}-\d{2}-\d{2}$/;
const ENTRY = /^## (\d{2}):(\d{2})(?: \((\d+)\))?$/;
const ABOUT = "About what: ";
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export interface Entry {
  path: string;
  day: string;
  time: string;
  anchor: string;
  /** `journal/YYYY-MM-DD.md#HHMM`: what unsorted lists and sort takes. */
  ref: string;
  mark: number;
  waiting: boolean;
  text: string;
}

export const dayPath = (day: string) => `journal/${day}.md`;
const isDay = (n: Note) => typeOf(n) === "Daily" && /^journal\/\d{4}-\d{2}-\d{2}\.md$/.test(n.path);

function sectionOf(lines: string[]): [number, number] | null {
  const start = lines.findIndex((l) => l.trim() === JOURNAL_HEADING);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && l.startsWith("# "));
  return [start + 1, end === -1 ? lines.length : end];
}

const trimBlank = (lines: string[]) => lines.join("\n").replace(/^\s*\n/, "").trimEnd();

/** Every entry in one day note, in the order written. */
export function entriesOf(path: string, body: string): Entry[] {
  const lines = body.split("\n");
  const range = sectionOf(lines);
  if (!range) return [];
  const day = path.slice("journal/".length, -3);
  const starts = lines.flatMap((l, i) => (i >= range[0] && i < range[1] && ENTRY.test(l) ? [i] : []));
  return starts.map((at, k) => {
    const [, hh, mm, n] = lines[at].match(ENTRY)!;
    const end = starts[k + 1] ?? range[1];
    let mark = at + 1;
    while (mark < end && !lines[mark].trim()) mark++;
    const marked = lines[mark] === WAITING || SORTED.test(lines[mark] ?? "");
    let from = marked ? mark + 1 : at + 1;
    while (from < end && (!lines[from].trim() || lines[from].startsWith(ABOUT))) from++;
    const anchor = `${hh}${mm}${n ? `-${n}` : ""}`;
    return { path, day, time: `${hh}:${mm}`, anchor, ref: `${path}#${anchor}`, mark: marked ? mark : -1, waiting: lines[mark] === WAITING, text: trimBlank(lines.slice(from, end)) };
  });
}

/** Journal entries that wait to be sorted, oldest first. */
export function waitingEntries(notes: Note[]): Entry[] {
  return notes.filter(isDay).flatMap((n) => entriesOf(n.path, n.body)).filter((e) => e.waiting);
}

export function findEntry(root: string, ref: string): Entry {
  const [path] = ref.split("#");
  if (!existsSync(join(root, path))) throw new Error(`No day note at ${path}.`);
  const hit = entriesOf(path, readNote(root, path).body).find((e) => e.ref === ref);
  if (!hit) throw new Error(`No journal entry at ${ref}.`);
  return hit;
}

export interface EntryInput {
  text: string;
  day?: string;
  /** ISO time; its HH:MM is the heading. */
  at?: string;
  about?: { title: string; path: string };
  by?: string;
  /** Ends the log line, so a retry can be found. */
  tag?: string;
}

function headingFor(lines: string[], time: string): { heading: string; anchor: string } {
  const taken = new Set(lines.filter((l) => ENTRY.test(l)));
  let heading = `## ${time}`;
  for (let n = 2; taken.has(heading); n++) heading = `## ${time} (${n})`;
  const suffix = heading.match(/\((\d+)\)$/)?.[1];
  return { heading, anchor: `${time.replace(":", "")}${suffix ? `-${suffix}` : ""}` };
}

/** Write one entry whole into its day note, made from the Daily template on first use. One log entry, so one undo. */
export function addEntry(root: string, input: EntryInput): Entry & { created: boolean } {
  const at = input.at ?? nowStamp();
  const day = input.day ?? (DAY.test(at.slice(0, 10)) ? at.slice(0, 10) : today());
  const time = /^\d{2}:\d{2}$/.test(at.slice(11, 16)) ? at.slice(11, 16) : nowStamp().slice(11, 16);
  const path = dayPath(day);
  const text = trimBlank(input.text.split("\n"));
  if (existsSync(join(root, path))) {
    const same = entriesOf(path, readNote(root, path).body).find((e) => e.text === text);
    if (same) return { ...same, created: false };
  }
  let anchor = "";
  changeFiles(root, [path], `journal ${path} ${time}${input.tag ? ` ${input.tag}` : ""}`, () => {
    if (!existsSync(join(root, path))) newNote(root, "Daily", day, { description: `Journal for ${day}.`, date: day });
    const note = readNote(root, path);
    const lines = note.body.replace(/\s+$/, "").split("\n");
    if (!sectionOf(lines)) lines.push("", JOURNAL_HEADING);
    const next = headingFor(lines, time);
    anchor = next.anchor;
    const about = input.about ? [`${ABOUT}[${input.about.title}](${posix.relative("journal", input.about.path)})`, ""] : [];
    let end = sectionOf(lines)![1];
    while (end > 0 && !lines[end - 1].trim()) end--;
    lines.splice(end, 0, "", next.heading, "", WAITING, "", ...about, text);
    const meta: Meta = input.by && !isOwnerWriter(input.by) ? { ...note.meta, generated: { by: input.by, at } } : note.meta;
    writeNote(root, path, meta, `${lines.join("\n")}\n`);
  });
  return { ...findEntry(root, `${path}#${anchor}`), created: true };
}

const linkBack = (from: string, e: Entry) => `[${e.day} ${e.time}](${posix.relative(posix.dirname(from), e.path)}#${e.anchor})`;

/**
 * Sort one journal entry into bits. Each bit links back with `· from`. The entry stays whole; its mark turns to sorted.
 * DECISION: the bits and the mark are one log entry, so one undo takes every bit out and the entry waits again.
 */
export function sortEntry(root: string, notes: Note[], ref: string, bits: SortBit[]): { into: string[]; kept: string } {
  const e = findEntry(root, ref);
  if (!e.waiting) throw new Error(`${ref} is sorted already.`);
  if (!bits.length) throw new Error("Say where the entry goes.");
  if (bits.some((b) => b.into === e.path)) throw new Error("A bit cannot go back into its own day note.");
  const into = [...new Set(bits.map((b) => b.into))];
  const flat = e.text.replace(/\s*\n\s*/g, " ");
  changeFiles(root, [...into, e.path], `sorted ${ref} into ${into.join(", ")}`, () => {
    for (const b of bits) fileInto(root, notes, b.into, b.text?.trim() || flat, b.when, { with: b.with, re: b.re, date: e.day, about: b.about, feeling: b.kind === "feeling", from: linkBack(b.into, e) });
    const note = readNote(root, e.path);
    const lines = note.body.split("\n");
    lines[e.mark] = `· sorted ${today()}`;
    writeNote(root, e.path, note.meta, lines.join("\n"));
  });
  return { into, kept: ref };
}
