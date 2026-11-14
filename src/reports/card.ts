// A subject card: everything about one subject on one screen. `find` prints it first when the
// words match a subject title, and `show` prints it for the note it opens.
//
// DECISION: "notes linked to it" means notes that link to the subject, minus areas, lenses, daily
// notes and captures. An area links to many subjects; pulling all its to-dos onto each card is noise.
// DECISION: Related adds the links of the subject's own events, so a visit's background notes
// (like the health history) show on the person's card.

import { DIRS, eventDue, extractLinks, folderOf, summary, titleOf, today, typeOf, type Note, type Summary } from "../core/notes.ts";
import { loopsIn, type Loop } from "../todos/todos.ts";
import { relationsOf, todosNaming } from "../core/index-links.ts";

export const SUBJECT_TYPES = ["Area", "Project", "Person", "Group", "Place", "Thing", "Topic", "Event", "Note", "Lens"];
const NOT_LINKED = ["Area", "Lens", "Daily", "Capture"];

export interface CardTodo { text: string; path: string; noteTitle: string; due?: string }
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

const live = (n: Note) => folderOf(n) !== DIRS.archive;
const DATED = /^- (\d{4}-\d{2}-\d{2}) · (.+)$/;

function todoOf(l: Loop): CardTodo {
  return { text: l.text, path: l.path, noteTitle: l.noteTitle, ...(l.due && { due: l.due }) };
}

export function isSubject(n: Note): boolean {
  return SUBJECT_TYPES.includes(typeOf(n) ?? "") && live(n);
}

// Who and what come before doing and knowing, so "doctor" finds the doctor before the visit.
const RANK = ["Person", "Group", "Place", "Thing", "Topic", "Project", "Event", "Note", "Area", "Lens"];
const rank = (n: Note) => RANK.indexOf(typeOf(n) ?? "");

/** Pick the subject a search is about: an exact title or slug first, then a title that holds every word. */
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
  const linking = notes.filter((x) => x.path !== n.path && live(x) && x.links.includes(n.path));
  const close = linking.filter((x) => !NOT_LINKED.includes(typeOf(x) ?? ""));

  // To do: open to-dos here, in close notes, and on lines anywhere that name it.
  const seen = new Set<string>();
  const todo: CardTodo[] = [];
  const push = (t: CardTodo) => {
    const key = `${t.path}\n${t.text}`;
    if (!seen.has(key)) { seen.add(key); todo.push(t); }
  };
  for (const note of [n, ...close]) for (const l of loopsIn(note)) if (!l.done) push(todoOf(l));
  for (const t of todosNaming(root, n.path, { done: false })) {
    const holder = byPath.get(t.path);
    if (holder && live(holder)) push({ text: t.text, path: t.path, noteTitle: titleOf(holder), due: loopsIn(holder).find((l) => l.text === t.text)?.due });
  }

  // Next: the soonest upcoming event or due to-do.
  const dated = [
    ...[n, ...close].flatMap((x) => (eventDue(x) ? [{ date: eventDue(x)!, text: titleOf(x), path: x.path }] : [])),
    ...todo.flatMap((t) => (t.due ? [{ date: t.due, text: t.text, path: t.path }] : [])),
  ].filter((d) => d.date >= today()).sort((a, b) => a.date.localeCompare(b.date));

  // History: the last 3 dated note lines and finished to-dos, from the subject and its close notes.
  // DECISION: the subject's own note and its events count whole. Any other note counts only for
  // lines that link to the subject, so a project's Greta line does not show on Omar's card.
  const history: CardLine[] = [];
  for (const note of [n, ...close]) {
    const whole = note === n || typeOf(note) === "Event";
    const about = (line: string) => whole || extractLinks(note.path, line).includes(n.path);
    for (const line of note.body.split("\n")) {
      const match = line.match(DATED);
      if (match && about(line)) history.push({ date: match[1], text: match[2].trim(), path: note.path });
    }
    for (const l of loopsIn(note)) if (l.done && l.doneAt && (whole || l.subjects?.includes(n.path))) history.push({ date: l.doneAt, text: `Done: ${l.text}`, path: note.path });
  }
  history.sort((a, b) => b.date.localeCompare(a.date));

  const rels = relationsOf(root, n.path);
  const titled = (p: string) => (byPath.get(p) ? titleOf(byPath.get(p)!) : p);
  const relations: CardRelation[] = [
    ...rels.out.map((r) => ({ direction: "out" as const, path: r.to, title: titled(r.to), heading: r.heading, ...(r.role && { role: r.role }), ...(r.time && { time: r.time }) })),
    ...rels.in.map((r) => ({ direction: "in" as const, path: r.from, title: titled(r.from), heading: r.heading, ...(r.role && { role: r.role }), ...(r.time && { time: r.time }) })),
  ];

  // Mentions: lenses that link to it. Related: every other linked note.
  const mentions = linking.filter((x) => typeOf(x) === "Lens").map(summary);
  const skip = new Set([n.path, ...relations.map((r) => r.path), ...mentions.map((m) => m.path)]);
  const events = close.filter((x) => typeOf(x) === "Event");
  const relatedPaths = [...n.links, ...linking.map((x) => x.path), ...events.flatMap((e) => e.links)];
  const related: Summary[] = [];
  for (const path of relatedPaths) {
    const note = byPath.get(path);
    if (!note || skip.has(path) || !live(note)) continue;
    skip.add(path);
    related.push(summary(note));
  }

  return { subject: summary(n), todo, ...(dated[0] && { next: dated[0] }), history: history.slice(0, 3), relations, related, mentions };
}

/** The card as plain lines for the terminal. */
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
