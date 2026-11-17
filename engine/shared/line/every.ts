const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const COUNTED = /^every (?:(\d+) )?(day|week|month|year)s?(?: on the (\d{1,2})(?:st|nd|rd|th))?$/;
const WEEKDAY = /^every (sun|mon|tue|wed|thu|fri|sat)[a-z]*$/;
const WHEN_DONE = " when done";

type Unit = "day" | "week" | "month" | "year";
type BaseRule = { n: number; unit: Unit; dayOfMonth?: number } | { weekday: number } | { workday: true };
export type EveryRule = BaseRule & { whenDone?: boolean };

function countedRule(words: string): BaseRule | null {
  const match = words.match(COUNTED);
  if (!match) return null;
  const [, countWord, unit, dayWord] = match;
  const n = Number(countWord ?? 1);
  const dayOfMonth = dayWord ? Number(dayWord) : undefined;
  if (n < 1) return null;
  if (dayOfMonth !== undefined && (unit !== "month" || dayOfMonth < 1 || dayOfMonth > 31)) return null;
  return { n, unit: unit as Unit, dayOfMonth };
}

function baseRule(words: string): BaseRule | null {
  if (words === "every weekday") return { workday: true };
  const counted = countedRule(words);
  if (counted) return counted;
  const day = words.match(WEEKDAY)?.[1];
  return day ? { weekday: DAYS.indexOf(day) } : null;
}

export function parseEvery(words: string): EveryRule | null {
  const tidy = words.trim().toLowerCase().replace(/\s+/g, " ");
  const whenDone = tidy.endsWith(WHEN_DONE);
  const base = baseRule(whenDone ? tidy.slice(0, -WHEN_DONE.length) : tidy);
  return base && { ...base, whenDone };
}
