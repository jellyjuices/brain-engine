import { readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { randomBytes } from "node:crypto";
import { type Note, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { diffLines, log, type UndoStep } from "../core/log.ts";
import { newNote } from "../capture/actions.ts";
import { addNoteLine } from "./todos.ts";
import { doneHistoryLine, dropTodo, fieldsOf, formatTodoLine, parseTodoLine, rollTodo, tickTodo, type TodoLine, updateTodo } from "../../shared/line/index.ts";
import { parseWhen, personNamed, subjectTitled } from "./when-words.ts";
import { change } from "./undo.ts";
import { type Item, resolve } from "./day-list.ts";

function editTodo(root: string, item: Item, fn: (l: TodoLine) => string[]): void {
  const note = readNote(root, item.path);
  const lines = note.body.split("\n");
  const i = lines.findIndex((line) => {
    const todo = parseTodoLine(line);
    return todo && !todo.done && todo.text === item.text;
  });
  if (i === -1) throw new Error(`"${item.text}" is no longer open in ${item.path}. Run brain to see the list again.`);
  lines.splice(i, 1, ...fn(parseTodoLine(lines[i])!));
  writeNote(root, item.path, note.meta, lines.join("\n"));
}

function editEvent(root: string, item: Item, fields: Record<string, string>): void {
  const note: Note = readNote(root, item.path);
  if (typeOf(note) !== "Event") throw new Error(`${item.path} is not an event.`);
  writeNote(root, item.path, { ...note.meta, ...fields }, note.body);
}

const where = (item: Item) => (item.kind === "event" ? "" : ` · ${item.subject}`);

export interface Extra {
  note?: string;
  also?: () => void;
}

const noteLineFor = (text: string | undefined) => {
  const oneLine = text?.replace(/\s*\n\s*/g, " ").trim();
  return oneLine ? `- ${today()} · ${oneLine}` : undefined;
};

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
      const note = noteLineFor(extra.note);
      const rolled = rollTodo(l, today());
      if (!rolled) return [formatTodoLine(tickTodo(l, today())), ...(note ? [note] : [])];
      next = fieldsOf(rolled).due;
      return [formatTodoLine(rolled), doneHistoryLine(l.text, today()), ...(note ? [note] : [])];
    });
    extra.also?.();
  });
  return { item, next, line: `Done: ${item.text}${where(item)}${next ? ` · next due ${next}` : ""} · undo` };
}

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
      const fields = fieldsOf(l);
      return [formatTodoLine(updateTodo(l, { due: w.due, outcome: w.outcome, with: who ? add(fields.with) : fields.with, re: what ? add(fields.re) : fields.re }))];
    });
  });
  return { item, line: `Moved: ${item.text}${where(item)} → ${label} · undo` };
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
      return [formatTodoLine(dropTodo(l, today())), ...(note ? [note] : [])];
    });
  });
  return { item, line: `Deleted: ${item.text}${where(item)} · undo` };
}
