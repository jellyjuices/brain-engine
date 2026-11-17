// Journal notes: one note per entry, journal/YYYY-MM-DD-HHMM-<slug>.md, type Journal. The body is the entry, whole.
// DECISION: `sorted: false` in the frontmatter while it waits; a sort sets `sorted: <date>`. The body never changes.
// DECISION: the slug comes from the title once. The owner may edit `title` later; links use the path, so they hold.

import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { type Meta, type Note, nowStamp, str, titleOf, today, typeOf } from "../core/notes.ts";
import { readNote, slugify, uniquePath, writeNote } from "../core/files.ts";
import { changeFiles } from "../core/log.ts";
import { isOwnerWriter } from "../core/owner.ts";
import { fileInto, type SortBit } from "./file.ts";

export const JOURNAL = "Journal";
const TITLE_WORDS = 6;
const TITLE_MAX = 60;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A title from the first words of the entry: about 6 words, cut at a word break, no trailing punctuation. No AI. */
export function titleFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).slice(0, TITLE_WORDS);
  let title = words.join(" ");
  if (title.length > TITLE_MAX) title = title.slice(0, title.lastIndexOf(" ", TITLE_MAX) > 0 ? title.lastIndexOf(" ", TITLE_MAX) : TITLE_MAX);
  return title.replace(/[\p{P}\p{S}\s]+$/u, "") || "Journal";
}

export const isJournal = (n: Note) => typeOf(n) === JOURNAL && n.path.startsWith("journal/");
export const isWaiting = (n: Note) => isJournal(n) && n.meta.sorted === false;

/** Journal notes that wait to be sorted, oldest first. */
export function waitingJournals(notes: Note[]): Note[] {
  return notes.filter(isWaiting).sort((a, b) => str(a.meta.date)!.localeCompare(str(b.meta.date)!));
}

export interface JournalInput {
  text: string;
  /** YYYY-MM-DD. Defaults to the day of `at`, then today. */
  day?: string;
  /** ISO time; its HH:MM goes in the path and in `date`. */
  at?: string;
  title?: string;
  about?: { title: string; path: string };
  by?: string;
  /** Ends the log line, so a retry can be found. */
  tag?: string;
}

/** Write one journal note. The same text on the same day returns that note, so a retry makes no copy. */
export function addJournalNote(root: string, notes: Note[], input: JournalInput): { path: string; created: boolean } {
  const at = input.at ?? nowStamp();
  const day = input.day ?? (DAY.test(at.slice(0, 10)) ? at.slice(0, 10) : today());
  const time = /^\d{2}:\d{2}$/.test(at.slice(11, 16)) ? at.slice(11, 16) : nowStamp().slice(11, 16);
  const text = input.text.replace(/^\s*\n/, "").trimEnd();
  const same = notes.find((n) => isJournal(n) && str(n.meta.date)?.startsWith(day) && n.body.startsWith(text));
  if (same) return { path: same.path, created: false };
  const title = input.title?.trim().replace(/\s+/g, " ").slice(0, 120) || titleFrom(text);
  const path = uniquePath(root, "journal", `${day}-${time.replace(":", "")}-${slugify(title, 40) || "journal"}`);
  const meta: Meta = { type: JOURNAL, title, description: `Journal for ${day} ${time}.`, date: `${day}T${time}`, sorted: false };
  if (input.by && !isOwnerWriter(input.by)) meta.generated = { by: input.by, at };
  const related = input.about ? `\n\n# Related\n\n- [${input.about.title}](${posix.relative("journal", input.about.path)}) · about` : "";
  changeFiles(root, [path], `journal ${path}${input.tag ? ` ${input.tag}` : ""}`, () => writeNote(root, path, meta, `${text}${related}\n`));
  return { path, created: true };
}

const linkBack = (from: string, n: Note) => `[${titleOf(n)}](${posix.relative(posix.dirname(from), n.path)})`;

/**
 * Sort one journal note into bits. Each bit links back with `· from`. The note stays whole; `sorted` gets the date.
 * DECISION: the bits and the mark are one log entry, so one undo takes every bit out and the note waits again.
 */
export function sortJournal(root: string, notes: Note[], path: string, bits: SortBit[]): { into: string[]; kept: string } {
  if (!existsSync(join(root, path))) throw new Error(`No note at ${path}.`);
  const note = readNote(root, path);
  if (!isJournal(note)) throw new Error(`${path} is not a journal note.`);
  if (!isWaiting(note)) throw new Error(`${path} is sorted already.`);
  if (!bits.length) throw new Error("Say where the journal goes.");
  if (bits.some((b) => b.into === path)) throw new Error("A bit cannot go back into its own journal note.");
  const into = [...new Set(bits.map((b) => b.into))];
  const day = str(note.meta.date)!.slice(0, 10);
  const flat = note.body.split(/\n# /)[0].trim().replace(/\s*\n\s*/g, " ");
  changeFiles(root, [...into, path], `sorted ${path} into ${into.join(", ")}`, () => {
    for (const b of bits) fileInto(root, notes, b.into, b.text?.trim() || flat, b.when, { with: b.with, re: b.re, date: day, about: b.about, feeling: b.kind === "feeling", from: linkBack(b.into, note) });
    writeNote(root, path, { ...note.meta, sorted: today() }, note.body);
  });
  return { into, kept: path };
}
