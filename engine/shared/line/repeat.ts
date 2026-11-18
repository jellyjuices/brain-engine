import { type EveryRule, parseEvery } from "./every.ts";
import { fieldsOf, updateTodo } from "./fields.ts";
import { formatTodoLine, parseTodoLine, type TodoLine } from "./line.ts";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function utc(s: string): Date {
  return new Date(`${s}T00:00:00Z`);
}

function stepMonths(date: Date, months: number, dayOfMonth: number | undefined): void {
  const day = dayOfMonth ?? date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
}

function step(d: Date, r: EveryRule): Date {
  const date = new Date(d);
  if ("workday" in r) {
    do date.setUTCDate(date.getUTCDate() + 1);
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
    return date;
  }
  if ("weekday" in r) {
    date.setUTCDate(date.getUTCDate() + (((r.weekday - date.getUTCDay() + 6) % 7) + 1));
    return date;
  }
  if (r.unit === "day") date.setUTCDate(date.getUTCDate() + r.n);
  else if (r.unit === "week") date.setUTCDate(date.getUTCDate() + 7 * r.n);
  else stepMonths(date, r.unit === "year" ? 12 * r.n : r.n, r.dayOfMonth);
  return date;
}

export function nextDue(every: string, from: string, now: string): string {
  const rule = parseEvery(`every ${every}`);
  if (!rule) throw new Error(`Not a repeat rule: every ${every}`);
  let next = step(utc(rule.whenDone ? now : from), rule);
  while (iso(next) <= now) next = step(next, rule);
  return iso(next);
}

export function doneHistoryLine(text: string, now: string): string {
  return `- ${now} · Done: ${text}`;
}

export function rollTodo(todo: TodoLine, now: string): TodoLine | null {
  const { every, due } = fieldsOf(todo);
  if (todo.done || !every) return null;
  return updateTodo(todo, { due: nextDue(every, due ?? now, now) });
}

function findRepeating(lines: string[], text: string): number {
  return lines.findIndex((line) => {
    const todo = parseTodoLine(line);
    return todo !== null && !todo.done && todo.text === text && fieldsOf(todo).every !== undefined;
  });
}

export function rollTodoIn(body: string, text: string, now: string, history: boolean): string | null {
  const lines = body.split("\n");
  const at = findRepeating(lines, text);
  if (at === -1) return null;
  const rolled = rollTodo(parseTodoLine(lines[at]!)!, now)!;
  lines.splice(at, 1, formatTodoLine(rolled), ...(history ? [doneHistoryLine(text, now)] : []));
  return lines.join("\n");
}

export function stopRepeatIn(body: string, text: string): string | null {
  const lines = body.split("\n");
  const at = findRepeating(lines, text);
  if (at === -1) return null;
  lines[at] = formatTodoLine(updateTodo(parseTodoLine(lines[at]!)!, { every: undefined }));
  return lines.join("\n");
}
