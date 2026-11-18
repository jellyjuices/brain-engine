import { allLoops, todoRef } from "./todos.ts";
import { eventDue, isArchived, type StoredNote } from "./model.ts";
import { copy } from "@/content/index.ts";

export type Group = "overdue" | "today" | "waiting";
export const GROUPS: { id: Group; label: string }[] = [
  { id: "overdue", label: copy.today.overdue },
  { id: "today", label: copy.common.today },
  { id: "waiting", label: copy.common.waitingOnSomeone },
];

export interface TodayItem {
  group: Group;
  kind: "todo" | "event";
  text: string;
  path: string;
  subject: string;
  due?: string;
  every?: string;
  ref: string;
}

export interface TodayData {
  date: string;
  items: TodayItem[];
  doneToday: number;
}

function groupOf(
  due: string | undefined,
  outcome: string | undefined,
  now: string,
): Group | undefined {
  if (due && due < now) return "overdue";
  if (due === now) return "today";
  if (outcome === "waiting") return "waiting";
  return undefined;
}

function sortItems(items: TodayItem[]): TodayItem[] {
  const order = GROUPS.map((g) => g.id);
  return items.sort(
    (a, b) =>
      order.indexOf(a.group) - order.indexOf(b.group) ||
      Number(!a.due) - Number(!b.due) ||
      (a.due ?? "").localeCompare(b.due ?? "") ||
      a.subject.localeCompare(b.subject),
  );
}

export function computeToday(notes: StoredNote[], now: string): TodayData {
  const raw: TodayItem[] = [];
  for (const l of allLoops(notes, { done: false })) {
    const group = groupOf(l.due, l.outcome, now);
    if (group)
      raw.push({
        group,
        kind: "todo",
        text: l.text,
        path: l.path,
        subject: l.noteTitle,
        ...(l.due && { due: l.due }),
        ...(l.every && { every: l.every }),
        ref: todoRef(l.path, l.text),
      });
  }
  for (const n of notes) {
    const due = eventDue(n);
    if (!due || isArchived(n)) continue;
    const group = groupOf(due, undefined, now);
    if (group)
      raw.push({
        group,
        kind: "event",
        text: n.title,
        path: n.path,
        subject: n.title,
        due,
        ref: n.path,
      });
  }
  const doneToday = allLoops(notes, { done: true }).filter(
    (l) => !l.dropped && l.doneAt === now,
  ).length;
  return { date: now, items: sortItems(raw), doneToday };
}

export function fromServer(data: unknown): { date: string; items: TodayItem[] } | null {
  const d = data as { date?: unknown; items?: unknown };
  if (typeof d?.date !== "string" || !Array.isArray(d.items)) return null;
  const items = (d.items as Record<string, unknown>[]).map((x) => ({
    group: x.group as Group,
    kind: x.kind as "todo" | "event",
    text: String(x.text),
    path: String(x.path),
    subject: String(x.subject),
    ...(typeof x.due === "string" && { due: x.due }),
    ...(typeof x.every === "string" && { every: x.every }),
    ref: String(x.ref),
  }));
  return { date: d.date, items: sortItems(items) };
}
