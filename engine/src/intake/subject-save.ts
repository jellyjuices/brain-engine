import { newNote } from "../capture/actions.ts";
import { addNoteLine } from "../todos/todos.ts";
import { appendToSection } from "../../shared/line/index.ts";
import { subjectsNamed } from "../capture/file.ts";
import { type Note, nowStamp, titleOf, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { findNote } from "../reports/find.ts";
import { change } from "../todos/undo.ts";
import { HEADING_OF, label, record, rel, SUBJECT_KINDS } from "./subjects.ts";

export interface SubjectInput {
  name: string;
  /** Person, Group, Place, Thing or Topic. Default Person. */
  type?: string;
  /** The owner's word for the role, never guessed. Blank when they skipped. */
  role?: string;
  /** A note (path, slug or title) the subject is linked to: "Acme" for "co-founder of Acme". */
  about?: string;
  /** The first fact, in the owner's words. */
  fact?: string;
  /** One line on what it is. Defaults to the owner's fact or role. */
  description?: string;
  by?: string;
}

export interface SubjectResult {
  skipped: boolean;
  path?: string;
  lines: string[];
}

interface Made {
  root: string;
  name: string;
  type: string;
  path: string;
  role?: string;
  fact?: string;
  lines: string[];
}

const trimmed = (s?: string) => s?.trim() || undefined;

function kindOf(raw?: string): string {
  const type = raw ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : "Person";
  if (!(SUBJECT_KINDS as readonly string[]).includes(type)) throw new Error(`type must be one of: ${SUBJECT_KINDS.join(", ")}`);
  return type;
}

function assertNew(notes: Note[], name: string) {
  const same = subjectsNamed(notes, name).some((n) => n.meta.title && titleOf(n).toLowerCase() === name.toLowerCase());
  if (same) throw new Error(`${name} already has a note. Add a fact with: brain intake fact`);
}

function aboutNote(notes: Note[], about?: string): Note | undefined {
  if (!about) return undefined;
  const note = findNote(notes, about);
  if (!note) throw new Error(`No note matches "${about}".`);
  return note;
}

function roleText(role: string, about?: Note) {
  return about ? `${role} of ${label(about)}` : role;
}

function describe(input: SubjectInput, role?: string, fact?: string, about?: Note): string {
  const fallback = about ? `Linked to ${label(about)}` : "";
  return (trimmed(input.description) ?? fact ?? (role ? roleText(role, about) : fallback)).slice(0, 150);
}

function saidRelation(m: Made, said: string) {
  m.lines.push(said);
  record(m.root, { kind: "relation", subject: m.name, type: m.type.toLowerCase(), text: said, path: m.path });
}

function linkTo(m: Made, about: Note) {
  const roleTail = m.role ? ` · ${m.role}` : "";
  const line = `- [${label(about)}](${rel(m.path, about.path)})${roleTail}`;
  const heading = HEADING_OF[typeOf(about) ?? ""] ?? "# Related";
  change(m.root, m.path, `intake: ${m.name} linked to ${label(about)}`, () => {
    const note = readNote(m.root, m.path);
    writeNote(m.root, m.path, note.meta, appendToSection(note.body, heading, line));
  });
  saidRelation(m, `${m.name}${m.role ? ` · ${m.role} of` : " ·"} ${label(about)}.`);
}

function roleOnly(m: Made, role: string) {
  saidRelation(m, `${m.name} · ${role}.`);
  if (!m.fact) change(m.root, m.path, `intake: ${m.name} · ${role}`, () => addNoteLine(m.root, m.path, role));
}

function firstFact(m: Made, fact: string) {
  change(m.root, m.path, `intake: first fact for ${m.name}`, () => addNoteLine(m.root, m.path, fact));
  record(m.root, { kind: "fact", subject: m.name, text: fact, path: m.path });
}

function writeRelations(m: Made, about?: Note) {
  if (about) linkTo(m, about);
  else if (m.role) roleOnly(m, m.role);
  if (m.fact) firstFact(m, m.fact);
}

const skippedAll = (input: SubjectInput, role?: string, fact?: string) => !role && !fact && !trimmed(input.description) && !input.about;

/** Make the subject's note from the owner's answer. Writes a relation line (when it is linked to a known note) and a first fact. */
export function saveSubject(root: string, input: SubjectInput): SubjectResult {
  const name = input.name.trim();
  const role = trimmed(input.role);
  const fact = trimmed(input.fact);
  if (!name) throw new Error("Give the name.");
  if (skippedAll(input, role, fact)) return { skipped: true, lines: [] };
  const type = kindOf(input.type);
  const notes = loadAll(root);
  assertNew(notes, name);
  const about = aboutNote(notes, input.about);
  const description = describe(input, role, fact, about);
  const made = newNote(root, type, name, { description, generated: { by: input.by ?? "claude", at: nowStamp() } });
  record(root, { kind: "new", subject: name, type: type.toLowerCase(), text: description, path: made.path });
  const m: Made = { root, name, type, path: made.path, role, fact, lines: [] };
  writeRelations(m, about);
  return { skipped: false, path: made.path, lines: m.lines };
}
