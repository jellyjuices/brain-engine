import type { Card, CardLine, CardRelation, CardSummary, CardTodo } from "./card-types.ts";
import { loopsIn, todoRef } from "./todos.ts";
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

export const SUBJECT_TYPES = [
  "Area",
  "Project",
  "Person",
  "Group",
  "Place",
  "Thing",
  "Topic",
  "Event",
  "Note",
  "Lens",
];
const NOT_LINKED = ["Area", "Lens", "Journal", "Capture"];
const RANK = [
  "Person",
  "Group",
  "Place",
  "Thing",
  "Topic",
  "Project",
  "Event",
  "Note",
  "Area",
  "Lens",
];

export function isSubject(n: StoredNote) {
  return SUBJECT_TYPES.includes(n.type ?? "") && !isArchived(n);
}

function sum(n: StoredNote): CardSummary {
  return {
    path: n.path,
    title: n.title,
    ...(n.type && { type: n.type }),
    description: n.description,
  };
}

export function matchSubject(notes: StoredNote[], query: string): StoredNote | undefined {
  const q = query.toLowerCase().trim();
  if (!q) return undefined;
  const words = q.split(/\s+/);
  const subjects = notes.filter(isSubject);
  function rank(n: StoredNote) {
    return RANK.indexOf(n.type ?? "");
  }
  return (
    subjects.find((n) => n.title.toLowerCase() === q || slugOf(n.path) === q) ??
    subjects
      .filter((n) => words.every((w) => n.title.toLowerCase().includes(w)))
      .sort((a, b) => rank(a) - rank(b))[0]
  );
}

const DATED = /^- (\d{4}-\d{2}-\d{2}) · (.+)$/;

export function buildCard(notes: StoredNote[], n: StoredNote, now: string): Card {
  const byPath = new Map(notes.map((x) => [x.path, x]));
  const live = notes.filter((x) => !isArchived(x));
  const linking = live.filter(
    (x) => x.path !== n.path && extractLinks(x.path, x.body).includes(n.path),
  );
  const close = linking.filter((x) => !NOT_LINKED.includes(x.type ?? ""));

  const seen = new Set<string>();
  const todo: CardTodo[] = [];
  function push(t: CardTodo) {
    const key = `${t.path}\n${t.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      todo.push({ ...t, ref: todoRef(t.path, t.text) });
    }
  }
  for (const x of [n, ...close])
    for (const l of loopsIn(x))
      if (!l.done)
        push({ text: l.text, path: l.path, noteTitle: l.noteTitle, ...(l.due && { due: l.due }) });
  for (const x of live) {
    if (x.path === n.path || !isLive(x)) continue;
    for (const l of loopsIn(x))
      if (!l.done && l.subjects?.includes(n.path))
        push({ text: l.text, path: l.path, noteTitle: l.noteTitle, ...(l.due && { due: l.due }) });
  }

  const dated = [
    ...[n, ...close].flatMap((x) =>
      eventDue(x) ? [{ date: eventDue(x)!, text: x.title, path: x.path }] : [],
    ),
    ...todo.flatMap((t) => (t.due ? [{ date: t.due, text: t.text, path: t.path }] : [])),
  ]
    .filter((d) => d.date >= now)
    .sort((a, b) => a.date.localeCompare(b.date));

  const history: CardLine[] = [];
  for (const x of [n, ...close]) {
    const whole = x === n || x.type === "Event";
    function about(line: string) {
      return whole || extractLinks(x.path, line).includes(n.path);
    }
    for (const line of x.body.split("\n")) {
      const m = line.match(DATED);
      if (m && about(line)) history.push({ date: m[1]!, text: m[2]!.trim(), path: x.path });
    }
    for (const l of loopsIn(x))
      if (l.done && l.doneAt && (whole || l.subjects?.includes(n.path)))
        history.push({ date: l.doneAt, text: `Done: ${l.text}`, path: x.path });
  }
  history.sort((a, b) => b.date.localeCompare(a.date));

  const out = relationsIn(n);
  const inn = live
    .filter((x) => x.path !== n.path)
    .flatMap((x) => relationsIn(x).filter((r) => r.to === n.path));
  function titled(p: string) {
    return byPath.get(p)?.title ?? slugOf(p);
  }
  const relations: CardRelation[] = [
    ...out.map((r): CardRelation => ({
      direction: "out",
      path: r.to,
      title: titled(r.to),
      heading: r.heading,
      ...(r.role && { role: r.role }),
      ...(r.time && { time: r.time }),
    })),
    ...inn.map((r): CardRelation => ({
      direction: "in",
      path: r.from,
      title: titled(r.from),
      heading: r.heading,
      ...(r.role && { role: r.role }),
      ...(r.time && { time: r.time }),
    })),
  ];

  const lenses = linking.filter((x) => x.type === "Lens").map((x) => x.path);
  const skip = new Set([n.path, ...relations.map((r) => r.path), ...lenses]);
  const events = close.filter((x) => x.type === "Event");
  const related: CardSummary[] = [];
  for (const p of [
    ...extractLinks(n.path, n.body),
    ...linking.map((x) => x.path),
    ...events.flatMap((e) => extractLinks(e.path, e.body)),
  ]) {
    const x = byPath.get(p);
    if (!x || skip.has(p) || isArchived(x) || folderOf(x) === "sources") continue;
    skip.add(p);
    related.push(sum(x));
  }

  return {
    subject: sum(n),
    todo,
    ...(dated[0] && { next: dated[0] }),
    history: history.slice(0, 3),
    relations,
    related,
  };
}

export function backlinksOf(notes: StoredNote[], path: string): CardSummary[] {
  return notes
    .filter((x) => x.path !== path && !isArchived(x) && extractLinks(x.path, x.body).includes(path))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(sum);
}

export function cardHasContent(c: Card) {
  return (
    c.todo.length > 0 ||
    !!c.next ||
    c.history.length > 0 ||
    c.relations.length > 0 ||
    c.related.length > 0
  );
}
