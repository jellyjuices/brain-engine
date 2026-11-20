import type { CardLine, CardRelation, CardSummary, CardTodo } from "./card-types.ts";
import { loopsIn, todoRef, type Loop } from "./todos.ts";
import { relationsIn } from "./relations.ts";
import {
  eventDue,
  extractLinks,
  folderOf,
  isArchived,
  isLive,
  slugOf,
  type StoredNote,
} from "./model.ts";

export type CardScope = {
  n: StoredNote;
  byPath: Map<string, StoredNote>;
  live: StoredNote[];
  linking: StoredNote[];
  close: StoredNote[];
};

const DATED = /^- (\d{4}-\d{2}-\d{2}) · (.+)$/;

export function cardSummary(n: StoredNote): CardSummary {
  return {
    path: n.path,
    title: n.title,
    ...(n.type && { type: n.type }),
    description: n.description,
  };
}

function cardTodo({ text, path, noteTitle, due, every }: Loop): CardTodo {
  return { text, path, noteTitle, ...(due && { due }), ...(every && { every }) };
}

function unique(todos: CardTodo[]): CardTodo[] {
  const seen = new Set<string>();
  return todos.flatMap((t) => {
    const key = `${t.path}\n${t.text}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{ ...t, ref: todoRef(t.path, t.text) }];
  });
}

function namingLoops(x: StoredNote, subject: string): Loop[] {
  if (x.path === subject || !isLive(x)) return [];
  return loopsIn(x).filter((l) => !l.done && l.subjects?.includes(subject));
}

export function cardTodos({ n, live, close }: CardScope): CardTodo[] {
  const own = [n, ...close].flatMap((x) => loopsIn(x).filter((l) => !l.done));
  const naming = live.flatMap((x) => namingLoops(x, n.path));
  return unique([...own, ...naming].map(cardTodo));
}

export function nextDated({ n, close }: CardScope, todo: CardTodo[], now: string) {
  const events = [n, ...close].flatMap((x) => {
    const date = eventDue(x);
    return date ? [{ date, text: x.title, path: x.path }] : [];
  });
  const dues = todo.flatMap((t) => (t.due ? [{ date: t.due, text: t.text, path: t.path }] : []));
  return [...events, ...dues]
    .filter((d) => d.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

function datedLines(x: StoredNote, about: (line: string) => boolean): CardLine[] {
  return x.body.split("\n").flatMap((line) => {
    const m = line.match(DATED);
    return m && about(line) ? [{ date: m[1]!, text: m[2]!.trim(), path: x.path }] : [];
  });
}

function doneLines(x: StoredNote, whole: boolean, subject: string): CardLine[] {
  return loopsIn(x).flatMap((l) =>
    l.done && l.doneAt && (whole || l.subjects?.includes(subject))
      ? [{ date: l.doneAt, text: `Done: ${l.text}`, path: x.path }]
      : [],
  );
}

function noteHistory(x: StoredNote, n: StoredNote): CardLine[] {
  const whole = x === n || x.type === "Event";
  function about(line: string) {
    return whole || extractLinks(x.path, line).includes(n.path);
  }
  return [...datedLines(x, about), ...doneLines(x, whole, n.path)];
}

export function cardHistory({ n, close }: CardScope): CardLine[] {
  return [n, ...close]
    .flatMap((x) => noteHistory(x, n))
    .sort((a, b) => b.date.localeCompare(a.date));
}

type Rel = ReturnType<typeof relationsIn>[number];

function relation(
  direction: "out" | "in",
  path: string,
  r: Rel,
  byPath: Map<string, StoredNote>,
): CardRelation {
  return {
    direction,
    path,
    title: byPath.get(path)?.title ?? slugOf(path),
    heading: r.heading,
    ...(r.role && { role: r.role }),
    ...(r.time && { time: r.time }),
  };
}

export function cardRelations({ n, byPath, live }: CardScope): CardRelation[] {
  const inn = live
    .filter((x) => x.path !== n.path)
    .flatMap((x) => relationsIn(x).filter((r) => r.to === n.path));
  return [
    ...relationsIn(n).map((r) => relation("out", r.to, r, byPath)),
    ...inn.map((r) => relation("in", r.from, r, byPath)),
  ];
}

function isRelatedNote(x: StoredNote | undefined, p: string, skip: Set<string>): x is StoredNote {
  return Boolean(x) && !skip.has(p) && !isArchived(x!) && folderOf(x!) !== "sources";
}

export function cardRelated(
  { n, byPath, linking, close }: CardScope,
  skip: Set<string>,
): CardSummary[] {
  const events = close.filter((x) => x.type === "Event");
  const paths = [
    ...extractLinks(n.path, n.body),
    ...linking.map((x) => x.path),
    ...events.flatMap((e) => extractLinks(e.path, e.body)),
  ];
  const related: CardSummary[] = [];
  for (const p of paths) {
    const x = byPath.get(p);
    if (!isRelatedNote(x, p, skip)) continue;
    skip.add(p);
    related.push(cardSummary(x));
  }
  return related;
}
