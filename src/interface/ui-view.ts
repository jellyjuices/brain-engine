import type { Card } from "../reports/card.ts";
import { addDays, DIRS, eventDue, folderOf, type Note, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { readLog } from "../core/log.ts";
import { allLoops } from "../todos/loops.ts";
import { dayList, type Item } from "../todos/day-list.ts";
import type { When } from "../capture/file.ts";

export interface Counts {
  inbox: number;
  overdue: number;
  today: number;
  doneToday: number;
}

export interface Opt {
  value: string;
  label: string;
  disabled?: boolean;
}

/** The numbers behind the header and the list. Reads the notes once. */
export function headerCounts(root: string, notes: Note[] = loadAll(root), items: Item[] = dayList(root, { save: false })): Counts {
  const now = today();
  return {
    inbox: notes.filter((n) => typeOf(n) === "Capture" && folderOf(n) === "inbox").length,
    overdue: items.filter((x) => x.group === "overdue").length,
    today: items.filter((x) => x.group === "today").length,
    doneToday: allLoops(notes, { done: true }).filter((l) => !l.dropped && l.doneAt === now).length,
  };
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Thu Nov 5" from an ISO date. */
export function shortDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${DAY_NAMES[date.getDay()]} ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

export const headerLine = (c: Counts, now = today()): string => `brain · ${shortDate(now)} · ${c.doneToday} done today`;

/** Cut a label to a width. The ellipsis counts. */
export function clip(t: string, width: number): string {
  return width > 0 && t.length > width ? t.slice(0, Math.max(1, width - 1)) + "…" : t;
}

/** A to-do label: its text and its subject. The text is cut first so the subject stays. */
export function todoLabel(text: string, subject: string | undefined, width: number): string {
  const full = subject ? `${text} · ${subject}` : text;
  if (full.length <= width) return full;
  if (subject) {
    const room = width - subject.length - 3;
    if (room >= 12) return `${clip(text, room)} · ${subject}`;
  }
  return clip(full, width);
}

const SECTION: Record<string, string> = { overdue: "Overdue", today: "Today", waiting: "Waiting on someone" };

/** The home list: sections of to-dos, then at most 5 extra options. Empty sections are not shown. */
export function listOptions(items: Item[], c: Pick<Counts, "inbox">, undoText?: string, width = 80): Opt[] {
  const opts: Opt[] = [];
  const room = width - 6;
  for (const group of ["overdue", "today", "waiting"]) {
    const rows = items.filter((x) => x.group === group);
    if (!rows.length) continue;
    opts.push({ value: `h:${group}`, label: SECTION[group], disabled: true });
    for (const item of rows) opts.push({ value: `todo:${item.n}`, label: todoLabel(item.text, item.subject, room) });
  }
  if (!opts.length) opts.push({ value: "h:none", label: "Nothing for today.", disabled: true });
  opts.push({ value: "h:rule", label: "─────", disabled: true });
  opts.push({ value: "add", label: "+ Add" }, { value: "find", label: "Find" });
  if (c.inbox > 0) opts.push({ value: "sort", label: `Sort inbox (${c.inbox})` });
  if (undoText) opts.push({ value: "undo", label: clip(`Undo: ${undoText}`, room) });
  opts.push({ value: "more", label: "More" });
  return opts;
}

/** What you can do with one to-do. The last line opens its subject, when there is one. */
export function todoActionOptions(subject?: string): Opt[] {
  return [
    { value: "done", label: "Done" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "day", label: "Pick a day" },
    { value: "someday", label: "Someday" },
    { value: "drop", label: "Drop" },
    ...(subject ? [{ value: "card", label: `Open ${subject}` }] : []),
  ];
}

export const MORE_OPTIONS: Opt[] = [
  { value: "review", label: "Weekly review" },
  { value: "intake", label: "Intake" },
  { value: "coming", label: "Coming up" },
  { value: "help", label: "Help" },
];

export const INTAKE_OPTIONS: Opt[] = [
  { value: "next", label: "What to talk about next" },
  { value: "dump", label: "Brain dump" },
  { value: "questions", label: "Open questions" },
];

export const HELP_LINES = [
  "Esc or Ctrl+C goes back one level. On the list it quits.",
  "Pick a to-do to mark it done, move it, drop it or open its subject.",
  "Add: type a thought. Start with today:, tomorrow:, fri: or note: and name a subject to file it straight away.",
  "Find: a subject card first, then other matches.",
  "Sort inbox: asks When? and About what? for each thing in the inbox.",
  "Undo shows after a change. Press u on the list to undo it.",
  "In a terminal you can also type: brain add, brain done, brain move, brain drop, brain find, brain undo.",
];

/** The newest change `brain undo` could reverse. */
export function undoHead(root: string): { id: string; msg: string } | undefined {
  const entries = readLog(root);
  const undone = new Set(entries.flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const entry = entries.find((x) => x.id && x.undo && !undone.has(x.id));
  return entry?.id ? { id: entry.id, msg: entry.msg } : undefined;
}

/** What `brain undo` would reverse now, or undefined if there is nothing. */
export const undoPreview = (root: string): string | undefined => undoHead(root)?.msg;

/** A short name for a log message: `done: Make a gym schedule (a.md)` becomes `Done "Make a gym…"`. */
export function undoLabel(msg: string): string {
  const match = msg.replace(/ \([^)]*\)$/, "").match(/^(\w+): (.+)$/);
  if (!match) return clip(msg, 30);
  return `${match[1][0].toUpperCase()}${match[1].slice(1)} "${clip(match[2], 14)}"`;
}

/** The line after an add. */
export function addedLine(title: string, when: When | undefined, now = today()): string {
  if (!when) return `Added to ${title}.`;
  if (when.kind === "note") return `Added to ${title} as a note.`;
  if (when.kind === "today") return `Added to ${title}, for today.`;
  if (when.kind === "someday") return `Added to ${title}, for someday.`;
  if (when.kind === "waiting") return `Added to ${title}, waiting on someone.`;
  return `Added to ${title}, for ${when.due === addDays(now, 1) ? "tomorrow" : when.due}.`;
}

/** Everything dated in the next days, soonest first. */
export function comingUp(notes: Note[], now = today(), days = 14): string[] {
  const end = addDays(now, days);
  const rows: { date: string; text: string }[] = [];
  for (const todo of allLoops(notes, { done: false })) if (todo.due && todo.due > now && todo.due <= end) rows.push({ date: todo.due, text: `${todo.text} · ${todo.noteTitle}` });
  for (const note of notes) {
    const due = eventDue(note);
    if (due && due > now && due <= end && folderOf(note) !== DIRS.archive) rows.push({ date: due, text: titleOf(note) });
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text)).map((r) => `${shortDate(r.date)}  ${r.text}`);
}

/** The card as the design shows it: title and kind, then To do, Next, Lately and relations. */
export function cardView(c: Card): string[] {
  const out = [`${c.subject.title} · ${c.subject.type ?? "Note"}`];
  const line = (name: string, text: string) => out.push(`${name.padEnd(7)} ${text}`);
  c.todo.forEach((t, i) => line(i ? "" : "To do", `${t.text}${t.due ? ` · ${t.due}` : ""}`));
  if (c.next) line("Next", `${c.next.text} · ${shortDate(c.next.date)}`);
  if (c.history[0]) line("Lately", `${c.history[0].date} · ${c.history[0].text}`);
  const heads = [...new Set(c.relations.map((r) => r.heading))];
  for (const heading of heads) line(heading, c.relations.filter((r) => r.heading === heading).map((r) => `${r.title}${r.role ? ` · ${r.role}` : ""}`).join(", "));
  return out;
}
