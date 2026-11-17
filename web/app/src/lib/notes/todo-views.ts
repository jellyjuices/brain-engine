import { byDue, inTodoView, type TodoView } from "@shared/todos/index.ts";
import { allLoops, todoRef, type Loop } from "./todos.ts";
import { longDate, type StoredNote } from "./model.ts";
import { copy } from "@/content/index.ts";

export const TODO_VIEW_TABS: { id: TodoView; label: string }[] = [
  { id: "today", label: copy.todos.viewToday },
  { id: "soon", label: copy.todos.viewSoon },
  { id: "no-date", label: copy.todos.viewNoDate },
  { id: "on-hold", label: copy.todos.viewOnHold },
  { id: "by-goal", label: copy.todos.viewByGoal },
  { id: "all", label: copy.todos.viewAll },
];

export interface ViewTodo extends Loop {
  ref: string;
}

export interface TodoGroup {
  key: string;
  title: string;
  late: boolean;
  items: ViewTodo[];
}

export function localView(notes: StoredNote[], view: TodoView, now: string): ViewTodo[] {
  return allLoops(notes, { done: false })
    .filter((l) => !l.dropped && inTodoView(view, l, now))
    .sort(byDue)
    .map((l) => ({ ...l, ref: todoRef(l.path, l.text) }));
}

function isViewTodo(x: unknown): x is ViewTodo {
  const t = x as Partial<ViewTodo> | null;
  return (
    typeof t?.text === "string" &&
    typeof t.path === "string" &&
    typeof t.noteTitle === "string" &&
    typeof t.ref === "string"
  );
}

export function fromTodosResponse(data: unknown): { date: string; items: ViewTodo[] } | null {
  const d = data as { date?: unknown; items?: unknown } | null;
  if (typeof d?.date !== "string" || !Array.isArray(d.items)) return null;
  return { date: d.date, items: d.items.filter(isViewTodo) };
}

export function linkLabel(token: string): string {
  return /\[([^\]]+)\]/.exec(token)?.[1] ?? token;
}

export function plainText(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

export function goalOf(todo: Loop): string | undefined {
  const first = todo.toward?.[0];
  return first ? linkLabel(first) : undefined;
}

function heldBy(todo: Loop): string {
  const who = todo.with?.[0];
  return who ? linkLabel(who) : todo.noteTitle;
}

function keyFor(view: TodoView, todo: ViewTodo, now: string): [string, string, boolean] {
  if (view === "today") {
    const late = (todo.due ?? now) < now;
    return late ? ["late", copy.today.overdue, true] : ["today", copy.today.dueToday, false];
  }
  if (view === "soon") return [todo.due ?? "", longDate(todo.due ?? now), false];
  if (view === "on-hold") return [heldBy(todo), heldBy(todo), false];
  if (view === "by-goal") {
    const goal = goalOf(todo) ?? todo.noteTitle;
    return [goal, goal, false];
  }
  return [todo.noteTitle, todo.noteTitle, false];
}

const KEEP_ORDER: readonly TodoView[] = ["today", "soon"];

export function groupView(view: TodoView, items: ViewTodo[], now: string): TodoGroup[] {
  const groups = new Map<string, TodoGroup>();
  items.forEach((todo) => {
    const [key, title, late] = keyFor(view, todo, now);
    const group = groups.get(key) ?? { key, title, late, items: [] };
    group.items.push(todo);
    groups.set(key, group);
  });
  const list = [...groups.values()];
  if (KEEP_ORDER.includes(view)) return list.sort((a, b) => Number(b.late) - Number(a.late));
  return list.sort((a, b) => a.title.localeCompare(b.title));
}
