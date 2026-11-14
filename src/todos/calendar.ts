import { createHash } from "node:crypto";
import { DIRS, eventDue, titleOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { allLoops } from "./loops.ts";

export interface CalEntry {
  uid: string;
  date: string;
  title: string;
  about: string;
}

export function icsText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

export function foldLine(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + n > limit) {
      out.push(cur);
      cur = "";
      bytes = 0;
    }
    cur += ch;
    bytes += n;
  }
  out.push(cur);
  return out.join("\r\n ");
}

function uidOf(key: string): string {
  return `${createHash("sha256").update(key).digest("hex").slice(0, 32)}@brain`;
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const compact = (date: string) => date.replaceAll("-", "");
const isDate = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function calendarEntries(root: string): CalEntry[] {
  const notes = loadAll(root);
  const out: CalEntry[] = [];
  for (const todo of allLoops(notes, { done: false })) {
    if (!isDate(todo.due)) continue;
    out.push({ uid: uidOf(`todo:${todo.path}::${todo.text}`), date: todo.due, title: todo.text, about: todo.noteTitle });
  }
  for (const note of notes) {
    const due = eventDue(note);
    if (!isDate(due) || note.path.startsWith(DIRS.archive)) continue;
    out.push({ uid: uidOf(`event:${note.path}`), date: due, title: titleOf(note), about: "" });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function calendarFeed(root: string, stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//brain-engine//calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Brain to-dos", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const e of calendarEntries(root)) {
    lines.push("BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${compact(e.date)}`, `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`, `SUMMARY:${icsText(e.title)}`);
    if (e.about) lines.push(`DESCRIPTION:${icsText(`About what: ${e.about}`)}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
