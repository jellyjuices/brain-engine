import { formatTodoLine, parseTodoLine, sectionRange, tickTodo } from "@shared/line/index.ts";
import type { StoredNote } from "./model.ts";

export interface GoalStep {
  text: string;
  done: boolean;
  doneAt?: string;
  due?: string;
  path: string;
  goal: string;
  ref?: string;
}

export interface GoalWin {
  date?: string;
  text: string;
  kind: "target" | "todo";
  path: string;
  goal: string;
}

export interface GoalRef {
  path: string;
  title: string;
  status: string;
  percent: number;
  done: number;
  total: number;
}

export interface DecisionRef {
  path: string;
  title: string;
  status: string;
  decide_by?: string;
}

export interface GoalView extends GoalRef {
  description: string;
  why: string;
  areas: string[];
  parent?: string;
  recent: number;
  next?: GoalStep;
  targets: GoalStep[];
  toward: GoalStep[];
  wins: GoalWin[];
  subgoals: GoalRef[];
  decisions: DecisionRef[];
}

const TARGETS_HEADING = "# Targets";

export function isGoalView(data: unknown): data is GoalView {
  const g = data as Partial<GoalView> | null;
  return (
    typeof g?.path === "string" &&
    typeof g.title === "string" &&
    typeof g.percent === "number" &&
    Array.isArray(g.targets) &&
    Array.isArray(g.toward) &&
    Array.isArray(g.wins) &&
    Array.isArray(g.subgoals) &&
    Array.isArray(g.decisions)
  );
}

export function goalRefsOf(data: unknown): GoalRef[] | null {
  const goals = (data as { goals?: unknown } | null)?.goals;
  if (!Array.isArray(goals)) return null;
  return goals.filter(
    (g): g is GoalRef =>
      typeof (g as GoalRef | null)?.path === "string" && typeof (g as GoalRef).title === "string",
  );
}

export function goalHref(path: string): string {
  return `/goal/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export function openSteps(goal: GoalView): GoalStep[] {
  const next = goal.next;
  const open = goal.toward.filter((s) => !s.done);
  if (!next) return open;
  return open.filter((s) => s.path !== next.path || s.text !== next.text);
}

export function linkedPaths(goal: GoalView): string[] {
  const own = new Set([goal.path, ...goal.subgoals.map((s) => s.path)]);
  return [...new Set(goal.toward.map((s) => s.path))].filter((p) => !own.has(p));
}

export function titleAt(notes: StoredNote[] | null, path: string): string {
  return notes?.find((n) => n.path === path)?.title ?? path.slice(path.lastIndexOf("/") + 1, -3);
}

export function crossTarget(body: string, text: string, date: string): string | null {
  const lines = body.split("\n");
  const range = sectionRange(lines, TARGETS_HEADING);
  if (!range) return null;
  const at = lines.findIndex((line, i) => {
    if (i < range[0] || i >= range[1]) return false;
    const todo = parseTodoLine(line);
    return todo !== null && !todo.done && todo.text === text;
  });
  const todo = at < 0 ? null : parseTodoLine(lines[at]!);
  if (!todo) return null;
  lines[at] = formatTodoLine(tickTodo(todo, date));
  return lines.join("\n");
}
