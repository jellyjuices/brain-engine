import { join } from "node:path";
import { areasOf, DIRS, folderOf, type Meta, type Note, str, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, moveNote, readNote, slugify, uniquePath, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { existsSync } from "node:fs";
import { addLoop, addNoteLine, live } from "./todos.ts";
import { toOutcome } from "../../shared/line/index.ts";

export interface AbsorbPlan {
  capture: string;
  text: string;
  into?: string; // undefined = no good home found
  as: "loop" | "note";
  reason: string;
}

const STOP = new Set(["with", "from", "that", "this", "have", "about", "into", "more", "some", "make", "start", "plan", "site", "sites", "next", "project", "move", "finish", "remake"]);
export const words = (t: string) => (t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => w.length >= 4 && !STOP.has(w));

/** Captures that are sorted (they have an outcome) and not yet absorbed. */
export function absorbable(notes: Note[]): Note[] {
  return notes.filter((n) => typeOf(n) === "Capture" && folderOf(n) !== DIRS.archive && n.meta.outcome && n.meta.outcome !== "drop");
}

export const captureText = (n: Note) => n.body.trim().replace(/\s*\n\s*/g, " ");
const asLoop = (n: Note) => !!toOutcome(str(n.meta.outcome)) || !!n.meta.due;

/** The best home for a capture: a project it names, then its area note. Never a person. */
export function suggestTarget(notes: Note[], cap: Note): { into?: string; reason: string } {
  const text = captureText(cap);
  const capWords = new Set(words(text));
  const area = areasOf(cap)[0];
  let best: { n: Note; score: number } | undefined;
  for (const note of notes.filter((n) => typeOf(n) === "Project" && live(n))) {
    const pw = words(titleOf(note));
    const score = pw.filter((w) => capWords.has(w)).length;
    const enough = score >= 2 || (score >= 1 && ((!!area && areasOf(note).includes(area)) || (!area && !areasOf(note).length) || pw.length === 1));
    if (enough && (!best || score > best.score)) best = { n: note, score };
  }
  if (best) return { into: best.n.path, reason: `matches project ${titleOf(best.n)}` };
  if (area && notes.some((n) => n.path === `areas/${area}.md`)) return { into: `areas/${area}.md`, reason: `its area` };
  return { reason: "no area set" };
}

export function planAbsorb(root: string, notes = loadAll(root)): AbsorbPlan[] {
  return absorbable(notes).map((cap) => {
    const target = suggestTarget(notes, cap);
    return { capture: cap.path, text: captureText(cap), into: target.into, as: asLoop(cap) ? "loop" : "note", reason: target.reason };
  });
}

/** Move a capture's text into a subject note (as an open loop or a dated note line), then archive the capture. */
export function absorb(root: string, capturePath: string, into: string): { into: string; as: "loop" | "note"; archived: string } {
  if (!existsSync(join(root, into))) throw new Error(`No note at ${into}.`);
  const cap = readNote(root, capturePath);
  if (typeOf(cap) !== "Capture") throw new Error(`${capturePath} is not a capture.`);
  const text = captureText(cap);
  const as = asLoop(cap) ? "loop" : "note";
  if (as === "loop") addLoop(root, into, { text, due: str(cap.meta.due), outcome: toOutcome(str(cap.meta.outcome)) });
  else addNoteLine(root, into, text, String(cap.meta.created ?? cap.meta.created_at ?? today()).slice(0, 10));
  const archived = uniquePath(root, DIRS.archive, slugify(text, 50));
  const meta: Meta = { ...cap.meta, absorbed_into: into };
  moveNote(root, capturePath, archived, meta, cap.body);
  log(root, `absorbed ${capturePath} into ${into}`);
  return { into, as, archived };
}

/** Make a new Project or Person note to absorb into. */
export function newSubject(root: string, type: "Project" | "Person", title: string, description: string, area?: string): string {
  if (!title.trim() || !description.trim()) throw new Error("A new note needs a title and a one-line description.");
  const folder = type === "Project" ? "projects" : "people";
  const rel = uniquePath(root, folder, slugify(title));
  const meta: Meta = { type, title: title.trim(), description: description.trim() };
  if (area) meta.areas = [area];
  const body = type === "Project" ? "# Goal\n\n# Status\n\n# To-dos\n\n# Notes" : "# Who\n\n# To-dos\n\n# Notes";
  writeNote(root, rel, meta, body);
  log(root, `created ${rel}`);
  return rel;
}
