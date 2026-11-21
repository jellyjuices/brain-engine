import { summary, titleOf, typeOf, type Note, type Summary } from "../core/notes.ts";
import { cardHistory, cardRelated, cardRelations, cardTodos, nextDated, notArchived, type CardScope } from "./card-parts.ts";

export const SUBJECT_TYPES = ["Area", "Project", "Person", "Group", "Place", "Thing", "Topic", "Event", "Note", "Lens"];
const NOT_LINKED = ["Area", "Lens", "Journal", "Capture"];

export interface CardTodo { text: string; path: string; noteTitle: string; due?: string; every?: string }
export interface CardLine { date: string; text: string; path: string }
export interface CardRelation { direction: "out" | "in"; path: string; title: string; role?: string; heading: string; time?: string }

export interface Card {
  subject: Summary;
  todo: CardTodo[];
  next?: { date: string; text: string; path: string };
  history: CardLine[];
  relations: CardRelation[];
  related: Summary[];
  mentions: Summary[];
}

export function isSubject(n: Note): boolean {
  return SUBJECT_TYPES.includes(typeOf(n) ?? "") && notArchived(n);
}

const RANK = ["Person", "Group", "Place", "Thing", "Topic", "Project", "Event", "Note", "Area", "Lens"];
const rank = (n: Note) => RANK.indexOf(typeOf(n) ?? "");

export function matchSubject(notes: Note[], query: string): Note | undefined {
  const needle = query.toLowerCase().trim();
  if (!needle) return undefined;
  const words = needle.split(/\s+/);
  const subjects = notes.filter(isSubject);
  const title = (n: Note) => titleOf(n).toLowerCase();
  return (
    subjects.find((n) => title(n) === needle || n.path.slice(n.path.indexOf("/") + 1, -3) === needle) ??
    subjects
      .filter((n) => words.every((w) => title(n).includes(w)))
      .sort((a, b) => rank(a) - rank(b))[0]
  );
}

export function buildCard(root: string, notes: Note[], n: Note): Card {
  const byPath = new Map(notes.map((x) => [x.path, x]));
  const linking = notes.filter((x) => x.path !== n.path && notArchived(x) && x.links.includes(n.path));
  const close = linking.filter((x) => !NOT_LINKED.includes(typeOf(x) ?? ""));
  const scope: CardScope = { root, n, byPath, linking, close };
  const todo = cardTodos(scope);
  const next = nextDated(scope, todo);
  const relations = cardRelations(scope);
  const mentions = linking.filter((x) => typeOf(x) === "Lens").map(summary);
  const skip = new Set([n.path, ...relations.map((r) => r.path), ...mentions.map((m) => m.path)]);
  const related = cardRelated(scope, skip);
  return { subject: summary(n), todo, ...(next && { next }), history: cardHistory(scope).slice(0, 3), relations, related, mentions };
}

export function cardLines(c: Card): string[] {
  const out = [`${c.subject.title}  (${c.subject.type ?? "Note"} · ${c.subject.path})`];
  if (c.subject.description) out.push(`  ${c.subject.description}`);
  const section = (name: string, lines: string[]) => {
    if (!lines.length) return;
    out.push("", name);
    for (const line of lines) out.push(`  ${line}`);
  };
  section("To do", c.todo.map((t) => `- ${t.text}${t.due ? ` · due ${t.due}` : ""}${t.path === c.subject.path ? "" : ` · ${t.noteTitle}`}`));
  if (c.next) section("Next", [`${c.next.date} · ${c.next.text}`]);
  section("History", c.history.map((h) => `${h.date} · ${h.text}`));
  section("Relations", c.relations.map((r) => `${r.direction === "out" ? "→" : "←"} ${r.title}${r.role ? ` · ${r.role}` : ""}${r.time ? ` · ${r.time}` : ""}`));
  section("Related", c.related.map((s) => `${s.title}  ${s.path}`));
  section("Mentions", c.mentions.map((s) => `${s.title}  ${s.path}`));
  return out;
}
