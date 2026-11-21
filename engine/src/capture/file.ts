import { unlinkSync } from "node:fs";
import { join, posix } from "node:path";
import { type Note, titleOf, today, typeOf } from "../core/notes.ts";
import { namesOf as sharedNamesOf, subjectsNamed as sharedSubjectsNamed } from "../../shared/sort/index.ts";
import { sortSubjects, toSortSubject } from "../sort/guess.ts";
import { readNote } from "../core/files.ts";
import { changeFiles } from "../core/log.ts";
import { addLoop, addNoteLine } from "../todos/todos.ts";
import { SEP } from "../../shared/line/index.ts";
import { captureText, suggestTarget } from "../todos/absorb.ts";
import { change } from "../todos/undo.ts";
import { parseWhen } from "../todos/when-words.ts";

export type When = { kind: "today" | "date" | "someday" | "waiting" | "note"; due?: string };

export const namesOf = (n: Note): string[] => sharedNamesOf(toSortSubject(n));

export function subjectsNamed(notes: Note[], text: string): Note[] {
  const byPath = new Map(notes.map((n) => [n.path, n]));
  return sharedSubjectsNamed(sortSubjects(notes), text).map((s) => byPath.get(s.path)!);
}

const isPerson = (n: Note) => typeOf(n) === "Person";

const namesAPerson = (notes: Note[], text: string) => subjectsNamed(notes, text).some(isPerson);

export function bestHome(notes: Note[], text: string, area?: string): { into?: string; reason: string } {
  const hit = subjectsNamed(notes, text).find((n) => !isPerson(n));
  if (hit) return { into: hit.path, reason: `names ${titleOf(hit)}` };
  const fake: Note = { path: "inbox/x.md", meta: { type: "Capture", ...(area && { area }) }, body: text, mtime: 0, links: [] };
  return suggestTarget(notes, fake);
}

export function whenFrom(word: string, now = today()): When | undefined {
  const w = word.trim().toLowerCase();
  if (w === "note") return { kind: "note" };
  try {
    const when = parseWhen(w, now);
    return { kind: (when.outcome ?? (w === "today" ? "today" : "date")) as When["kind"], due: when.due };
  } catch {
    return undefined;
  }
}

export function splitPrefix(input: string, now = today()): { when?: When; text: string } {
  const match = input.match(/^\s*([\p{L}\d-]+):\s+(.+)$/su);
  const when = match ? whenFrom(match[1], now) : undefined;
  return when ? { when, text: match![2].trim() } : { text: input.trim() };
}

const linkFrom = (from: string, to: Note) => `[${titleOf(to).split(",")[0]}](${posix.relative(posix.dirname(from), to.path)})`;

export interface FileOpts {
  with?: string[];
  re?: string[];
  date?: string;
  about?: string;
  feeling?: boolean;
  from?: string;
  check?: boolean;
}

export function fileInto(root: string, notes: Note[], into: string, text: string, when: When, opts: FileOpts = {}): string {
  const about = opts.about?.trim() || undefined;
  if (when.kind === "note") {
    const parts = [opts.feeling && "feeling", text, about && `about ${about}`, opts.check && "check", opts.from && `from ${opts.from}`];
    addNoteLine(root, into, parts.filter(Boolean).join(SEP), opts.date ?? today());
    return "note";
  }
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const links = (paths: string[] = []) => paths.filter((p) => p !== into && byPath.has(p)).map((p) => linkFrom(into, byPath.get(p)!));
  const [w, re] = [links(opts.with), links(opts.re)];
  const outcome = when.kind === "date" ? undefined : when.kind;
  addLoop(root, into, { text, due: when.kind === "someday" || when.kind === "waiting" ? undefined : when.due, outcome, ...(w.length && { with: w }), ...(re.length && { re }), ...(about && { about }), ...(opts.check && { check: true }), ...(opts.from && { from: opts.from }) });
  return "to-do";
}

export const BIT_KINDS = ["to-do", "fact", "feeling", "decision"] as const;

export interface SortBit {
  into: string;
  when: When;
  text?: string;
  with?: string[];
  re?: string[];
  kind?: (typeof BIT_KINDS)[number];
  about?: string;
}

export function sortBits(root: string, notes: Note[], capturePath: string, bits: SortBit[]): { into: string[]; deleted: string } {
  const cap = readNote(root, capturePath);
  if (typeOf(cap) !== "Capture") throw new Error(`${capturePath} is not a capture.`);
  if (!bits.length) throw new Error("Say where the capture goes.");
  const date = String(cap.meta.created ?? today()).slice(0, 10);
  const into = [...new Set(bits.map((b) => b.into))];
  changeFiles(root, [...into, capturePath], `sorted ${capturePath} into ${into.join(", ")}`, () => {
    for (const b of bits) fileInto(root, notes, b.into, b.text?.trim() || captureText(cap), b.when, { with: b.with, re: b.re, date, about: b.about, feeling: b.kind === "feeling" });
    unlinkSync(join(root, capturePath));
  });
  return { into, deleted: capturePath };
}

export function sortCapture(root: string, notes: Note[], capturePath: string, into: string, when: When, opts: { with?: string[] } = {}): { into: string; deleted: string } {
  return { into, deleted: sortBits(root, notes, capturePath, [{ into, when, with: opts.with }]).deleted };
}

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
