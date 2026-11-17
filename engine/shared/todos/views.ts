import type { TodoFields } from "../line/index.ts";
import { addDays } from "./dates.ts";

export const TODO_VIEWS = ["today", "soon", "no-date", "on-hold", "by-goal", "all"] as const;
export type TodoView = (typeof TODO_VIEWS)[number];

const SOON_DAYS = 14;

type ViewTodo = Pick<TodoFields, "due" | "outcome" | "toward">;

const MATCH: Record<TodoView, (t: ViewTodo, now: string) => boolean> = {
  today: (t, now) => !!t.due && t.due <= now,
  soon: (t, now) => !!t.due && t.due > now && t.due <= addDays(now, SOON_DAYS),
  "no-date": (t) => !t.due && t.outcome !== "waiting",
  "on-hold": (t) => t.outcome === "waiting",
  "by-goal": (t) => !!t.toward?.length,
  all: () => true,
};

export function isTodoView(value: string): value is TodoView {
  return (TODO_VIEWS as readonly string[]).includes(value);
}

export function inTodoView(view: TodoView, todo: ViewTodo, now: string): boolean {
  return MATCH[view](todo, now);
}

export function byDue(a: { due?: string; text: string }, b: { due?: string; text: string }): number {
  return (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.text.localeCompare(b.text);
}
