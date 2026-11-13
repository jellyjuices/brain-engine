// Intake builds relations: ask about unknown subjects, link known ones, file to-dos, and summarise.
//
// DECISION: a session is a file in .reports/ (git ignores it) so each `brain intake …` call in a
// non-TTY agent run shares one state: who was asked, who was offered a note, and what got written.
// DECISION: a subject gets its note when the owner answers (it then has its own facts). A skipped question
// writes nothing. Every edit to an existing note goes through `change`, so `brain undo` reverses it.
// A new note itself is not undone by `brain undo`: the summary says to move it to .archive/.

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { newNote } from "../capture/actions.ts";
import { addNoteLine, appendToSection } from "../todos/loops.ts";
import { subjectsNamed } from "../capture/file.ts";
import { type Note, nowStamp, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeAtomic, writeNote } from "../core/files.ts";
import { findNote } from "../reports/find.ts";
import { guessKind, knownNames, namesIn, secondMentions } from "../reports/mentions.ts";
import { change } from "../todos/undo.ts";

export const SESSION_FILE = ".reports/intake-session.json";
export const SUBJECT_KINDS = ["Person", "Group", "Place", "Thing", "Topic"] as const;
/** Subject types that get a link in a lens line. Areas are common words, so they stay plain. */
export const LINKABLE = ["Person", "Group", "Place", "Thing", "Topic", "Project", "Event"];
const HEADING_OF: Record<string, string> = { Person: "# People", Group: "# Groups", Project: "# Projects", Place: "# Places", Thing: "# Things", Topic: "# Topics" };

export interface SessionChange {
  kind: "new" | "relation" | "fact" | "todo";
  subject: string;
  type?: string;
  text: string;
  path: string;
}

export interface SessionState {
  date: string;
  asked: string[];
  offered: string[];
  changes: SessionChange[];
}

export const fresh = (): SessionState => ({ date: today(), asked: [], offered: [], changes: [] });

export function readSession(root: string): SessionState {
  const full = join(root, SESSION_FILE);
  if (!existsSync(full)) return fresh();
  try {
    const session = JSON.parse(readFileSync(full, "utf8")) as SessionState;
    return session.date === today() ? { ...fresh(), ...session } : fresh();
  } catch {
    return fresh();
  }
}

export function writeSession(root: string, s: SessionState): void {
  mkdirSync(dirname(join(root, SESSION_FILE)), { recursive: true });
  writeAtomic(join(root, SESSION_FILE), JSON.stringify(s, null, 2) + "\n");
}

export function record(root: string, c: SessionChange): void {
  const session = readSession(root);
  writeSession(root, { ...session, changes: [...session.changes, c] });
}

const key = (name: string) => name.trim().toLowerCase();

export interface Prompts {
  /** The one question to ask now, or none. */
  ask?: { name: string; question: string; kind: string };
  /** Names that came up again with no note. */
  offers: { name: string; prompt: string; kind?: string }[];
}

/** The one question for an unknown subject. */
export function questionFor(name: string, text: string): string {
  if (/\b(project|working on|building|launch|client|contract|pitch|part in)\b/i.test(text)) return `What is your part in ${name}?`;
  return guessKind(name) === "Person" ? `Who is ${name} to you?` : `What is ${name}?`;
}

/**
 * Read what the owner just said. Returns at most one question (for the first unknown subject not asked yet
 * this session) and an offer for each subject that came up a second time. Both are remembered, so
 * the same subject is never asked or offered twice in a session.
 */
export function intakePrompts(root: string, text: string, notes = loadAll(root)): Prompts {
  const session = readSession(root);
  const known = knownNames(notes);
  const again = secondMentions(root, text, notes);
  const againKeys = new Set(again.map((m) => key(m.name)));
  const offers = again.filter((m) => !session.offered.includes(key(m.name))).map((m) => ({ name: m.name, prompt: `${m.name} came up again. Make a note?`, kind: m.suggest }));
  const unknown = [...new Set(namesIn(text))].filter((n) => !known.has(key(n)) && !againKeys.has(key(n)) && !session.asked.includes(key(n)));
  const ask = unknown[0] ? { name: unknown[0], question: questionFor(unknown[0], text), kind: guessKind(unknown[0]) ?? "" } : undefined;
  writeSession(root, { ...session, asked: ask ? [...session.asked, key(ask.name)] : session.asked, offered: [...session.offered, ...offers.map((o) => key(o.name))] });
  return { ask, offers };
}

export const rel = (from: string, to: string) => posix.relative(posix.dirname(from), to);
const label = (n: Note) => titleOf(n).split(",")[0];

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

/** Make the subject's note from the owner's answer. Writes a relation line (when it is linked to a known note) and a first fact. */
export function saveSubject(root: string, input: SubjectInput): SubjectResult {
  const name = input.name.trim();
  const role = input.role?.trim() || undefined;
  const fact = input.fact?.trim() || undefined;
  if (!name) throw new Error("Give the name.");
  if (!role && !fact && !input.description?.trim() && !input.about) return { skipped: true, lines: [] }; // the owner skipped: write nothing, never guess
  const type = input.type ? input.type[0].toUpperCase() + input.type.slice(1).toLowerCase() : "Person";
  if (!(SUBJECT_KINDS as readonly string[]).includes(type)) throw new Error(`type must be one of: ${SUBJECT_KINDS.join(", ")}`);
  const notes = loadAll(root);
  if (subjectsNamed(notes, name).some((n) => n.meta.title && titleOf(n).toLowerCase() === name.toLowerCase())) throw new Error(`${name} already has a note. Add a fact with: brain intake fact`);
  const about = input.about ? findNote(notes, input.about) : undefined;
  if (input.about && !about) throw new Error(`No note matches "${input.about}".`);
  const description = (input.description?.trim() || fact || (role ? `${role}${about ? ` of ${label(about)}` : ""}` : about ? `Linked to ${label(about)}` : "")).slice(0, 150);
  const made = newNote(root, type, name, { description, generated: { by: input.by ?? "claude", at: nowStamp() } });
  const lines: string[] = [];
  record(root, { kind: "new", subject: name, type: type.toLowerCase(), text: description, path: made.path });
  if (about) {
    const line = `- [${label(about)}](${rel(made.path, about.path)})${role ? ` · ${role}` : ""}`;
    const heading = HEADING_OF[typeOf(about) ?? ""] ?? "# Related";
    change(root, made.path, `intake: ${name} linked to ${label(about)}`, () => {
      const note = readNote(root, made.path);
      writeNote(root, made.path, note.meta, appendToSection(note.body, heading, line));
    });
    const said = `${name}${role ? ` · ${role} of` : " ·"} ${label(about)}.`;
    lines.push(said);
    record(root, { kind: "relation", subject: name, type: type.toLowerCase(), text: said, path: made.path });
  } else if (role) {
    // No known subject to link to: the role is a fact on the note, in their words.
    const said = `${name} · ${role}.`;
    lines.push(said);
    record(root, { kind: "relation", subject: name, type: type.toLowerCase(), text: said, path: made.path });
    if (!fact) change(root, made.path, `intake: ${name} · ${role}`, () => addNoteLine(root, made.path, `${role}`));
  }
  if (fact) {
    change(root, made.path, `intake: first fact for ${name}`, () => addNoteLine(root, made.path, fact));
    record(root, { kind: "fact", subject: name, text: fact, path: made.path });
  }
  return { skipped: false, path: made.path, lines };
}

/** Add a dated fact line to an existing subject note. Undoable. */
export function addSubjectFact(root: string, into: string, text: string): string {
  const note = findNote(loadAll(root), into);
  if (!note) throw new Error(`No note matches "${into}".`);
  change(root, note.path, `intake: fact added to ${note.path}`, () => addNoteLine(root, note.path, text));
  record(root, { kind: "fact", subject: titleOf(note), text: text.trim(), path: note.path });
  return note.path;
}

/** Fix one thing the owner has said about a subject: the role on its relation line. Undoable. */
export function setRole(root: string, subject: string, about: string, role: string): string {
  const notes = loadAll(root);
  const note = findNote(notes, subject);
  const target = findNote(notes, about);
  if (!note || !target) throw new Error("Name the subject and the note it links to.");
  const link = `(${rel(note.path, target.path)})`;
  const lines = note.body.split("\n");
  const i = lines.findIndex((l) => l.startsWith("- [") && l.includes(link));
  if (i === -1) throw new Error(`${note.path} has no relation line to ${label(target)}.`);
  const head = lines[i].split(" · ")[0];
  lines[i] = role.trim() ? `${head} · ${role.trim()}` : head;
  change(root, note.path, `intake: role of ${label(note)} set`, () => writeNote(root, note.path, note.meta, lines.join("\n")));
  return note.path;
}
