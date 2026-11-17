import { today } from "../core/notes.ts";
import { type EveryRule as Rule, parseEvery } from "../../shared/line/index.ts";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);

function step(d: Date, r: Rule): Date {
  const date = new Date(d);
  if ("workday" in r) {
    do date.setUTCDate(date.getUTCDate() + 1); while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
    return date;
  }
  if ("weekday" in r) { date.setUTCDate(date.getUTCDate() + (((r.weekday - date.getUTCDay() + 6) % 7) + 1)); return date; }
  if (r.unit === "day") date.setUTCDate(date.getUTCDate() + r.n);
  else if (r.unit === "week") date.setUTCDate(date.getUTCDate() + 7 * r.n);
  else {
    const day = r.dayOfMonth ?? date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + (r.unit === "year" ? 12 * r.n : r.n));
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last)); // Jan 31 + 1 month = Feb 28
  }
  return date;
}

/** The next due date after the old due date (or after today with `when done`). Skips dates that are already past. */
export function nextDue(every: string, from: string, now = today()): string {
  const rule = parseEvery(`every ${every}`);
  if (!rule) throw new Error(`Not a repeat rule: every ${every}`);
  let next = step(utc(rule.whenDone ? now : from), rule);
  while (iso(next) <= now) next = step(next, rule);
  return iso(next);
}
