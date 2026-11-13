import { today } from "../core/notes.ts";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
type Base = { n: number; unit: "day" | "week" | "month" | "year"; dayOfMonth?: number } | { weekday: number } | { workday: true };
type Rule = Base & { whenDone?: boolean };

/** Read "every 2 weeks", "every mon", "every weekday", "every month on the 1st", "... when done". Null when it is not a rule. */
export function parseEvery(t: string): Rule | null {
  let s = t.trim().toLowerCase().replace(/\s+/g, " ");
  const whenDone = s.endsWith(" when done");
  if (whenDone) s = s.slice(0, -10);
  const base = ((): Base | null => {
    if (s === "every weekday") return { workday: true };
    const m = s.match(/^every (?:(\d+) )?(day|week|month|year)s?(?: on the (\d{1,2})(?:st|nd|rd|th))?$/);
    if (m) {
      const count = Number(m[1] ?? 1), dom = m[3] ? Number(m[3]) : undefined;
      if (count < 1 || (dom !== undefined && (m[2] !== "month" || dom < 1 || dom > 31))) return null;
      return { n: count, unit: m[2] as "day", dayOfMonth: dom };
    }
    const match = s.match(/^every (sun|mon|tue|wed|thu|fri|sat)[a-z]*$/);
    return match ? { weekday: DAYS.indexOf(match[1]) } : null;
  })();
  return base && { ...base, whenDone };
}

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
