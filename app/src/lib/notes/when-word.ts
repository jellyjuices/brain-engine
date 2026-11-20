import { addDays } from "./model.ts";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_WORD =
  /\b(?:(mon|tue|tues|thu|thur|thurs|fri)(?:day|sday|rsday)?|(wed)nesday|(sat)urday|(sun)day)\b/i;

export function dayInText(text: string, now: string): string | null {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];
  if (/\btoday\b/i.test(text)) return now;
  if (/\btomorrow\b/i.test(text)) return addDays(now, 1);
  if (/\bnext week\b/i.test(text)) {
    const dow = new Date(`${now}T12:00:00`).getDay();
    return addDays(now, (1 - dow + 7) % 7 || 7);
  }
  const hit = text.match(DAY_WORD);
  const word = (hit?.[1] ?? hit?.[2] ?? hit?.[3] ?? hit?.[4])?.slice(0, 3).toLowerCase();
  const target = word ? DAYS.indexOf(word) : -1;
  if (target < 0) return null;
  const dow = new Date(`${now}T12:00:00`).getDay();
  return addDays(now, (target - dow + 7) % 7 || 7);
}
