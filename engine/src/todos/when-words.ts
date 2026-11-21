import { addDays, type Note, titleOf, today, typeOf } from "../core/notes.ts";
import type { Outcome } from "../../shared/line/index.ts";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function parseWhen(when: string, now = today()): { due?: string; outcome?: Outcome; label: string } {
  const word = when.trim().toLowerCase();
  if (word === "today") return { due: now, label: "today" };
  if (word === "tomorrow") return { due: addDays(now, 1), label: "tomorrow" };
  if (word === "someday") return { outcome: "someday", label: "someday" };
  if (word === "waiting") return { outcome: "waiting", label: "waiting on someone" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(word)) return { due: word, label: word };
  const md = word.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})$/);
  const mi = md ? MONTHS.indexOf(md[1]) : -1;
  if (md && mi !== -1) {
    const day = Number(md[2]);
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = Number(now.slice(0, 4));
    let due = `${year}-${pad(mi + 1)}-${pad(day)}`;
    if (due < now) due = `${year + 1}-${pad(mi + 1)}-${pad(day)}`;
    if (new Date(`${due}T12:00:00`).getDate() !== day) throw new Error(`There is no ${md[1]} ${day}.`);
    return { due, label: due };
  }
  const day = DAYS.indexOf(word.slice(0, 3));
  if (day !== -1) {
    const dow = new Date(`${now}T12:00:00`).getDay();
    const due = addDays(now, ((day - dow + 7) % 7) || 7);
    return { due, label: due };
  }
  throw new Error(`Say when: today, tomorrow, a weekday, nov 20, YYYY-MM-DD, someday or waiting. Not "${when}".`);
}

export function personNamed(notes: Note[], name: string): Note | undefined {
  const want = name.trim().toLowerCase();
  if (!want) return undefined;
  const people = notes.filter((n) => typeOf(n) === "Person");
  const by = (fn: (n: Note) => boolean) => {
    const hits = people.filter(fn);
    return hits.length === 1 ? hits[0] : undefined;
  };
  return (
    by((n) => titleOf(n).toLowerCase() === want) ??
    by((n) => titleOf(n).toLowerCase().split(/\s+/)[0] === want) ??
    by((n) => n.path.replace(/^.*\/|\.md$/g, "") === want.replace(/\s+/g, "-"))
  );
}

export function subjectTitled(notes: Note[], title: string): Note | undefined {
  const want = title.trim().toLowerCase();
  const hits = notes.filter((n) => !["Person", "Capture", "Lens", "Journal", "Area"].includes(typeOf(n) ?? "") && !n.path.startsWith(".") && titleOf(n).toLowerCase() === want);
  return hits.length === 1 ? hits[0] : undefined;
}
