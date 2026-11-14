// One-step filing. A thought goes straight into its subject note, as a to-do or a dated note line.
// Used by the sort screen and by `brain add` with a When prefix ("tomorrow: ask Dr about Advil").
//
// DECISION: a subject "matches" when its title, its first name (people) or one of its `aliases`
// shows in the text as whole words. Most specific type wins: event, person, group, place, thing,
// topic, project, then area. Other named people become `· with`, other named subjects `· re`.
// DECISION: `brain add` skips the inbox only with a When prefix and a match. Without a prefix,
// "is this a to-do or a fact?" is a guess, so it goes to the inbox with the best match shown.

import { posix } from "node:path";
import { DIRS, folderOf, type Meta, type Note, str, titleOf, today, typeOf } from "../core/notes.ts";
import { moveNote, readNote, slugify, uniquePath } from "../core/files.ts";
import { log } from "../core/log.ts";
import { addLoop, addNoteLine } from "../todos/todos.ts";
import { captureText, suggestTarget } from "../todos/absorb.ts";
import { change } from "../todos/undo.ts";
import { parseWhen } from "../todos/when-words.ts";

export type When = { kind: "today" | "date" | "someday" | "waiting" | "note"; due?: string };

const TYPE_RANK = ["Event", "Person", "Group", "Place", "Thing", "Topic", "Project", "Area"];

const live = (n: Note) => folderOf(n) !== DIRS.archive && str(n.meta.status) !== "deprecated" && !(typeOf(n) === "Event" && ["done", "cancelled"].includes(String(n.meta.status)));

export function namesOf(n: Note): string[] {
  const aliases = Array.isArray(n.meta.aliases) ? n.meta.aliases.map(String) : [];
  const title = titleOf(n);
  const names = [title, title.split(",")[0], ...aliases];
  if (typeOf(n) === "Person") names.push(title.split(/[\s,]+/)[0]);
  return [...new Set(names.map((x) => x.trim().toLowerCase()).filter((x) => x.length >= 2))];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const named = (text: string, name: string) => new RegExp(`(^|[^\\p{L}\\p{N}])${esc(name)}($|[^\\p{L}\\p{N}])`, "iu").test(text);

/** Subjects the text names, most specific type first. */
export function subjectsNamed(notes: Note[], text: string): Note[] {
  return notes
    .filter((n) => live(n) && TYPE_RANK.includes(typeOf(n) ?? ""))
    .filter((n) => namesOf(n).some((nm) => named(text, nm)))
    .sort((a, b) => TYPE_RANK.indexOf(typeOf(a)!) - TYPE_RANK.indexOf(typeOf(b)!) || titleOf(b).length - titleOf(a).length);
}

const isPerson = (n: Note) => typeOf(n) === "Person";

export const namesAPerson = (notes: Note[], text: string) => subjectsNamed(notes, text).some(isPerson);

/** Where a thought most likely goes: a named subject that is not a person, then the old word match (projects, area). */
export function bestHome(notes: Note[], text: string, area?: string): { into?: string; reason: string } {
  const hit = subjectsNamed(notes, text).find((n) => !isPerson(n));
  if (hit) return { into: hit.path, reason: `names ${titleOf(hit)}` };
  const fake: Note = { path: "inbox/x.md", meta: { type: "Capture", ...(area && { area }) }, body: text, mtime: 0, links: [] };
  return suggestTarget(notes, fake);
}

/** Read a When answer, as a word or a prefix: today, tomorrow, a weekday, a date, someday, waiting or note. */
export function whenFrom(word: string, now = today()): When | undefined {
  const w = word.trim().toLowerCase();
  if (w === "note") return { kind: "note" };
  try {
    const when = parseWhen(w, now);
    return { kind: (when.outcome ?? "date") as When["kind"], due: when.due };
  } catch {
    return undefined;
  }
}

/** Split "tomorrow: ask Dr" into its When and the text. */
export function splitPrefix(input: string, now = today()): { when?: When; text: string } {
  const match = input.match(/^\s*([\p{L}\d-]+):\s+(.+)$/su);
  const when = match ? whenFrom(match[1], now) : undefined;
  return when ? { when, text: match![2].trim() } : { text: input.trim() };
}

const linkFrom = (from: string, to: Note) => `[${titleOf(to).split(",")[0]}](${posix.relative(posix.dirname(from), to.path)})`;

/** Write the text into a subject note as a to-do or a note line. */
export function fileInto(root: string, notes: Note[], into: string, text: string, when: When, opts: { with?: string[]; re?: string[]; date?: string } = {}): string {
  if (when.kind === "note") {
    addNoteLine(root, into, text, opts.date ?? today());
    return "note";
  }
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const links = (paths: string[] = []) => paths.filter((p) => p !== into && byPath.has(p)).map((p) => linkFrom(into, byPath.get(p)!));
  const [w, re] = [links(opts.with), links(opts.re)];
  const outcome = when.kind === "date" ? undefined : when.kind;
  addLoop(root, into, { text, due: when.kind === "someday" || when.kind === "waiting" ? undefined : when.due, outcome, ...(w.length && { with: w }), ...(re.length && { re }) });
  return "to-do";
}

/** File one inbox capture in one step: write its line in the subject note, then archive it with absorbed_into. */
export function sortCapture(root: string, notes: Note[], capturePath: string, into: string, when: When, opts: { with?: string[] } = {}): { into: string; archived: string } {
  const cap = readNote(root, capturePath);
  if (typeOf(cap) !== "Capture") throw new Error(`${capturePath} is not a capture.`);
  const text = captureText(cap);
  fileInto(root, notes, into, text, when, { ...opts, date: String(cap.meta.created ?? today()).slice(0, 10) });
  const archived = uniquePath(root, DIRS.archive, slugify(text, 50));
  const meta: Meta = { ...cap.meta, absorbed_into: into };
  moveNote(root, capturePath, archived, meta, cap.body);
  log(root, `sorted ${capturePath} into ${into}`);
  return { into, archived };
}

/** `brain add`: with a When prefix and a named subject, file it there. Otherwise save to the inbox. */
export function smartAdd(root: string, notes: Note[], input: string): { filed: true; into: string; as: string; text: string } | { filed: false; guess?: string; text: string } {
  const { when, text } = splitPrefix(input);
  const hits = subjectsNamed(notes, text);
  if (!when || !hits.length || (hits.some(isPerson) && when.kind !== "note")) return { filed: false, guess: bestHome(notes, text).into, text };
  const into = hits[0].path;
  const re = hits.filter((n) => n.path !== into).map((n) => n.path);
  let as = "";
  change(root, into, `added to ${into}: ${text}`, () => { as = fileInto(root, notes, into, text, when, { re }); });
  return { filed: true, into, as, text };
}
