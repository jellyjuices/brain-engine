import type { Card, CardSummary } from "./card-types.ts";
import {
  cardHistory,
  cardRelated,
  cardRelations,
  cardSummary,
  cardTodos,
  nextDated,
  type CardScope,
} from "./card-parts.ts";
import { extractLinks, isArchived, slugOf, type StoredNote } from "./model.ts";

const SUBJECT_TYPES = [
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

export function buildCard(notes: StoredNote[], n: StoredNote, now: string): Card {
  const byPath = new Map(notes.map((x) => [x.path, x]));
  const live = notes.filter((x) => !isArchived(x));
  const linking = live.filter(
    (x) => x.path !== n.path && extractLinks(x.path, x.body).includes(n.path),
  );
  const close = linking.filter((x) => !NOT_LINKED.includes(x.type ?? ""));
  const scope: CardScope = { n, byPath, live, linking, close };
  const todo = cardTodos(scope);
  const next = nextDated(scope, todo, now);
  const relations = cardRelations(scope);
  const lenses = linking.filter((x) => x.type === "Lens").map((x) => x.path);
  const skip = new Set([n.path, ...relations.map((r) => r.path), ...lenses]);
  return {
    subject: cardSummary(n),
    todo,
    ...(next && { next }),
    history: cardHistory(scope).slice(0, 3),
    relations,
    related: cardRelated(scope, skip),
  };
}

export function backlinksOf(notes: StoredNote[], path: string): CardSummary[] {
  return notes
    .filter((x) => x.path !== path && !isArchived(x) && extractLinks(x.path, x.body).includes(path))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(cardSummary);
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
