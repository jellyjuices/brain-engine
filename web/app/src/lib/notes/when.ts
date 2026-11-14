import type { Outcome } from "@shared/line/index.ts";
import { copy } from "@/content/index.ts";
export interface WhenPreview {
  kind: string;
  label: string;
  due?: string;
  outcome?: Outcome;
}

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function at(isoDate: string) {
  return new Date(`${isoDate}T12:00:00`);
}

function addDays(isoDate: string, n: number): string {
  const d = at(isoDate);
  d.setDate(d.getDate() + n);
  return iso(d);
}

function niceDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(at(isoDate));
}

function whenFrom(word: string, now: string): WhenPreview | undefined {
  const w = word.trim().toLowerCase();
  if (w === "note") return { kind: "note", label: copy.common.note };
  if (w === "today") return { kind: "today", label: copy.common.today, due: now, outcome: "today" };
  if (w === "tomorrow")
    return {
      kind: "date",
      label: `${copy.common.tomorrow}, ${niceDate(addDays(now, 1))}`,
      due: addDays(now, 1),
    };
  if (w === "someday") return { kind: "someday", label: copy.common.someday, outcome: "someday" };
  if (w === "waiting")
    return { kind: "waiting", label: copy.common.waitingOnSomeone, outcome: "waiting" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(w)) {
    const d = at(w);
    return Number.isNaN(d.getTime()) || iso(d) !== w
      ? undefined
      : { kind: "date", label: niceDate(w), due: w };
  }
  const md = w.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})$/);
  const mi = md ? MONTHS.indexOf(md[1]!) : -1;
  if (md && mi !== -1) {
    const day = Number(md[2]);
    const year = Number(now.slice(0, 4));
    let due = `${year}-${pad(mi + 1)}-${pad(day)}`;
    if (due < now) due = `${year + 1}-${pad(mi + 1)}-${pad(day)}`;
    return at(due).getDate() === day ? { kind: "date", label: niceDate(due), due } : undefined;
  }
  const d = DAYS.indexOf(w.slice(0, 3));
  if (d !== -1 && w.length <= 9) {
    const dow = at(now).getDay();
    const due = addDays(now, (d - dow + 7) % 7 || 7);
    return { kind: "date", label: niceDate(due), due };
  }
  return undefined;
}

export function readWhen(word: string, now = iso(new Date())): WhenPreview | undefined {
  return whenFrom(word, now);
}

export function splitWhen(
  input: string,
  now = iso(new Date()),
): { when?: WhenPreview; text: string } {
  const m = input.match(/^\s*([\p{L}\d-]+):\s+(.+)$/su);
  const when = m ? whenFrom(m[1]!, now) : undefined;
  return when ? { when, text: m![2]!.trim() } : { text: input.trim() };
}

export function previewWhen(input: string, now = iso(new Date())): WhenPreview | null {
  if (!input.trim()) return null;
  const m = input.match(/^\s*([\p{L}\d-]+):\s+(.+)$/su);
  const when = m ? whenFrom(m[1]!, now) : undefined;
  return when ? { kind: when.kind, label: when.label } : { kind: "inbox", label: "Inbox" };
}
