import { DIRS, eventDue, extractLinks, folderOf, summary, titleOf, today, typeOf, type Note, type Summary } from "../core/notes.ts";
import { loopsIn, type Loop } from "../todos/todos.ts";
import { relationsOf, todosNaming } from "../core/index-links.ts";
import type { CardLine, CardRelation, CardTodo } from "./card.ts";

export interface CardScope {
  root: string;
  n: Note;
  byPath: Map<string, Note>;
  linking: Note[];
  close: Note[];
}

export const notArchived = (n: Note) => folderOf(n) !== DIRS.archive;
const DATED = /^- (\d{4}-\d{2}-\d{2}) · (.+)$/;

function todoOf(l: Loop): CardTodo {
  return { text: l.text, path: l.path, noteTitle: l.noteTitle, ...(l.due && { due: l.due }), ...(l.every && { every: l.every }) };
}

function namingTodo(holder: Note | undefined, text: string, path: string): CardTodo[] {
  if (!holder || !notArchived(holder)) return [];
  return [{ text, path, noteTitle: titleOf(holder), due: loopsIn(holder).find((l) => l.text === text)?.due }];
}

function unique(todos: CardTodo[]): CardTodo[] {
  const seen = new Set<string>();
  return todos.filter((t) => {
    const key = `${t.path}\n${t.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cardTodos({ root, n, byPath, close }: CardScope): CardTodo[] {
  const own = [n, ...close].flatMap((note) => loopsIn(note).filter((l) => !l.done).map(todoOf));
  const naming = todosNaming(root, n.path, { done: false }).flatMap((t) => namingTodo(byPath.get(t.path), t.text, t.path));
  return unique([...own, ...naming]);
}

export function nextDated({ n, close }: CardScope, todo: CardTodo[]): CardLine | undefined {
  const events = [n, ...close].flatMap((x) => {
    const date = eventDue(x);
    return date ? [{ date, text: titleOf(x), path: x.path }] : [];
  });
  const dues = todo.flatMap((t) => (t.due ? [{ date: t.due, text: t.text, path: t.path }] : []));
  return [...events, ...dues].filter((d) => d.date >= today()).sort((a, b) => a.date.localeCompare(b.date))[0];
}

function datedLines(note: Note, about: (line: string) => boolean): CardLine[] {
  return note.body.split("\n").flatMap((line) => {
    const match = line.match(DATED);
    return match && about(line) ? [{ date: match[1], text: match[2].trim(), path: note.path }] : [];
  });
}

function doneLines(note: Note, whole: boolean, subject: string): CardLine[] {
  const counts = (l: Loop) => l.done && l.doneAt && (whole || l.subjects?.includes(subject));
  return loopsIn(note).filter(counts).map((l) => ({ date: l.doneAt!, text: `Done: ${l.text}`, path: note.path }));
}

function noteHistory(note: Note, n: Note): CardLine[] {
  const whole = note === n || typeOf(note) === "Event";
  const about = (line: string) => whole || extractLinks(note.path, line).includes(n.path);
  return [...datedLines(note, about), ...doneLines(note, whole, n.path)];
}

export function cardHistory({ n, close }: CardScope): CardLine[] {
  return [n, ...close].flatMap((note) => noteHistory(note, n)).sort((a, b) => b.date.localeCompare(a.date));
}

type Rel = { heading: string; role?: string; time?: string };

function relation(direction: "out" | "in", path: string, r: Rel, byPath: Map<string, Note>): CardRelation {
  const note = byPath.get(path);
  return { direction, path, title: note ? titleOf(note) : path, heading: r.heading, ...(r.role && { role: r.role }), ...(r.time && { time: r.time }) };
}

export function cardRelations({ root, n, byPath }: CardScope): CardRelation[] {
  const rels = relationsOf(root, n.path);
  return [...rels.out.map((r) => relation("out", r.to, r, byPath)), ...rels.in.map((r) => relation("in", r.from, r, byPath))];
}

export function cardRelated({ n, byPath, linking, close }: CardScope, skip: Set<string>): Summary[] {
  const events = close.filter((x) => typeOf(x) === "Event");
  const paths = [...n.links, ...linking.map((x) => x.path), ...events.flatMap((e) => e.links)];
  const related: Summary[] = [];
  for (const path of paths) {
    const note = byPath.get(path);
    if (!note || skip.has(path) || !notArchived(note)) continue;
    skip.add(path);
    related.push(summary(note));
  }
  return related;
}
