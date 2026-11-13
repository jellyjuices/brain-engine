// The verbs the owner uses on to-dos: `brain` (the numbered list), done, move, drop and undo.
//
// `brain` with no words lists overdue, today, then waiting on someone, numbered. The list is saved to
// .brain/last-list.json so `brain done 2` means line 2 of the list the owner just saw.
// Every change logs what it replaced, so `brain undo` can put it back.
//
// DECISION: undo stores only the changed lines and checks they are still there. If another agent
// changed those lines since, undo stops and says so, rather than overwrite their work.

import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { randomBytes } from "node:crypto";
import { type Note, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { log, type UndoStep } from "../core/log.ts";
import { newNote } from "../capture/actions.ts";
import { addNoteLine, formatLoop, parseLoopLine } from "./loops.ts";
import { nextDue } from "./repeat.ts";
import { parseWhen, personNamed, subjectTitled } from "./when-words.ts";
import { change, diffLines } from "./undo.ts";
import { type Item, resolve } from "./day-list.ts";

/** Rewrite the open to-do line with this text in a note. fn returns the new lines for it. */
type Line = NonNullable<ReturnType<typeof parseLoopLine>>;
function editTodo(root: string, item: Item, fn: (l: Line) => string[]): void {
  const note = readNote(root, item.path);
  const lines = note.body.split("\n");
  const i = lines.findIndex((line) => {
    const todo = parseLoopLine(line);
    return todo && !todo.done && todo.text === item.text;
  });
  if (i === -1) throw new Error(`"${item.text}" is no longer open in ${item.path}. Run brain to see the list again.`);
  lines.splice(i, 1, ...fn(parseLoopLine(lines[i])!));
  writeNote(root, item.path, note.meta, lines.join("\n"));
}

function editEvent(root: string, item: Item, fields: Record<string, string>): void {
  const note: Note = readNote(root, item.path);
  if (typeOf(note) !== "Event") throw new Error(`${item.path} is not an event.`);
  writeNote(root, item.path, { ...note.meta, ...fields }, note.body);
}

const where = (item: Item) => (item.kind === "event" ? "" : ` · ${item.subject}`);

/** Extra lines written in the same change as done or drop, so one undo reverses all of it. */
export interface Extra {
  /** The answer to "What happened?" (done) or "Why?" (drop). It becomes a dated note line. */
  note?: string;
  /** Runs after the tick, inside the same change. Used for the follow-up to-do. */
  also?: () => void;
}

const noteLineFor = (text: string | undefined) => {
  const oneLine = text?.replace(/\s*\n\s*/g, " ").trim();
  return oneLine ? `- ${today()} · ${oneLine}` : undefined;
};

/** For an event there is no ticked line, so the note goes under its notes. */
function eventNote(root: string, item: Item, note: string | undefined): void {
  const oneLine = note?.replace(/\s*\n\s*/g, " ").trim();
  if (oneLine) addNoteLine(root, item.path, oneLine);
}

export function done(root: string, ref: string, extra: Extra = {}): { item: Item; next?: string; line: string } {
  const item = resolve(root, ref);
  let next: string | undefined;
  change(root, item.path, `done: ${item.text} (${item.path})`, () => {
    if (item.kind === "event") {
      editEvent(root, item, { status: "done" });
      eventNote(root, item, extra.note);
      return extra.also?.();
    }
    editTodo(root, item, (l) => {
      const ticked = formatLoop({ ...l, done: true, doneAt: today(), every: undefined });
      const note = noteLineFor(extra.note);
      if (!l.every) return [ticked, ...(note ? [note] : [])];
      next = nextDue(l.every, l.due ?? today());
      return [ticked, ...(note ? [note] : []), formatLoop({ text: l.text, due: next, every: l.every, outcome: l.outcome, with: l.with, re: l.re })];
    });
    extra.also?.();
  });
  return { item, next, line: `Done: ${item.text}${where(item)}${next ? ` · next due ${next}` : ""} · brain undo` };
}

/**
 * Move a to-do. "Put on hold" uses the waiting When with `who` (a person) or `what` (a thing).
 * Who links `· with [Name](...)`, what links `· re [Thing](...)`.
 * DECISION: a name with no note gets a new Person or Thing note, so "search or create new" works the same from every screen.
 */
export function move(root: string, ref: string, when: string, opts: { who?: string; what?: string } = {}): { item: Item; line: string } {
  const item = resolve(root, ref);
  const w = parseWhen(when);
  const tidy = (t?: string) => (w.outcome === "waiting" ? t?.replace(/\s+/g, " ").trim() || undefined : undefined);
  const who = tidy(opts.who);
  const what = who ? undefined : tidy(opts.what);
  let label = w.label;
  change(root, item.path, `move: ${item.text} to ${who ? `waiting on ${who}` : what ? `waiting for ${what}` : w.label} (${item.path})`, () => {
    if (item.kind === "event") {
      if (!w.due) throw new Error("An event needs a date. Use today, tomorrow, a weekday or YYYY-MM-DD.");
      return editEvent(root, item, { date: w.due });
    }
    let subject: Note | undefined;
    if (who || what) {
      const notes = loadAll(root);
      subject = who ? personNamed(notes, who) : subjectTitled(notes, what!);
      subject ??= newNote(root, who ? "Person" : "Thing", (who ?? what)!, {
        description: who ? `Someone the owner is waiting on for: ${item.text}`.slice(0, 150) : `Something the owner is waiting for, for: ${item.text}`.slice(0, 150),
        generated: { by: "brain", at: new Date().toISOString() },
      });
      label = `${who ? "waiting on" : "waiting for"} ${titleOf(subject)}`;
    }
    editTodo(root, item, (l) => {
      const link = subject && `[${titleOf(subject)}](${posix.relative(posix.dirname(item.path), subject.path)})`;
      const add = (xs: string[] | undefined) => (link && !(xs ?? []).includes(link) ? [...(xs ?? []), link] : xs);
      return [formatLoop({ ...l, due: w.due, outcome: w.outcome, with: who ? add(l.with) : l.with, re: what ? add(l.re) : l.re })];
    });
  });
  return { item, line: `Moved: ${item.text}${where(item)} → ${label} · brain undo` };
}

export function drop(root: string, ref: string, extra: Extra = {}): { item: Item; line: string } {
  const item = resolve(root, ref);
  change(root, item.path, `drop: ${item.text} (${item.path})`, () => {
    if (item.kind === "event") {
      editEvent(root, item, { status: "cancelled" });
      return eventNote(root, item, extra.note);
    }
    editTodo(root, item, (l) => {
      const note = noteLineFor(extra.note);
      return [formatLoop({ ...l, done: true, doneAt: today(), every: undefined, dropped: true }), ...(note ? [note] : [])];
    });
  });
  return { item, line: `Dropped: ${item.text}${where(item)} · brain undo` };
}

/** Move many items in one change, logged as one entry so one `brain undo` reverses all. Events only take a date. */
export function moveMany(root: string, items: Item[], when: string, now = today()): { moved: Item[]; skipped: Item[] } {
  const w = parseWhen(when, now);
  const steps: UndoStep[] = [];
  const moved: Item[] = [];
  const skipped: Item[] = [];
  for (const item of items) {
    if (item.kind === "event" && !w.due) { skipped.push(item); continue; }
    const before = readFileSync(join(root, item.path), "utf8");
    if (item.kind === "event") editEvent(root, item, { date: w.due! });
    else editTodo(root, item, (l) => [formatLoop({ ...l, due: w.due, outcome: w.outcome })]);
    steps.push(diffLines(item.path, before, readFileSync(join(root, item.path), "utf8")));
    moved.push(item);
  }
  if (steps.length) log(root, `move ${moved.length} to ${w.label}: ${moved.map((x) => x.text).join("; ")}`, { id: randomBytes(4).toString("hex"), undo: steps });
  return { moved, skipped };
}
