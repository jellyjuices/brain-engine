import {
  LOOPS_HEADING,
  NOTES_HEADING,
  appendToSection,
  formatLoop,
  parseLoopLine,
  sectionRange,
} from "@/lib/notes/loops.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { splitWhen } from "@/lib/notes/when.ts";

export type Decision =
  | { kind: "done"; happened?: string; follow_up?: string }
  | { kind: "move"; when: string; who?: string; what?: string }
  | { kind: "drop"; why?: string };

export interface TodoRef {
  text: string;
  path: string;
  subject: string;
  kind: "todo" | "event";
  ref: string;
  due?: string;
}

function oneLine(t: string | undefined) {
  return t?.replace(/\s*\n\s*/g, " ").trim() || undefined;
}
function dated(now: string, t: string | undefined) {
  return oneLine(t) ? `- ${now} · ${oneLine(t)}` : undefined;
}

function editLine(
  body: string,
  text: string,
  fn: (l: NonNullable<ReturnType<typeof parseLoopLine>>) => string[],
): string | null {
  const lines = body.split("\n");
  const r = sectionRange(lines, LOOPS_HEADING);
  if (!r) return null;
  for (let i = r[0]; i < r[1]; i++) {
    const l = parseLoopLine(lines[i]!);
    if (l && !l.done && l.text === text) {
      lines.splice(i, 1, ...fn(l));
      return lines.join("\n");
    }
  }
  return null;
}

export function dueFor(when: string, now: string): { due?: string; outcome?: string } {
  if (when === "someday") return { outcome: "someday" };
  if (when === "waiting") return { outcome: "waiting" };
  if (when === "today") return { due: now, outcome: "today" };
  return { due: when };
}

function addFollowUp(body: string, text: string, now: string): string {
  const { when, text: t } = splitWhen(text, now);
  if (when?.kind === "note") return appendToSection(body, NOTES_HEADING, `- ${now} · ${t}`);
  const w = when ?? { due: now, outcome: "today" };
  return appendToSection(
    body,
    LOOPS_HEADING,
    formatLoop({ text: t, done: false, due: w.due, outcome: w.outcome }),
  );
}

export function applyDecision(
  note: StoredNote,
  todo: TodoRef,
  d: Decision,
  now: string,
): StoredNote | null {
  if (todo.kind === "event") {
    const meta = { ...note.meta };
    if (d.kind === "done") meta.status = "done";
    else if (d.kind === "drop") meta.status = "cancelled";
    else {
      const w = dueFor(d.when, now);
      if (!w.due) return null;
      meta.date = w.due;
    }
    const closed = meta.status === "done" || meta.status === "cancelled";
    return {
      ...note,
      meta,
      status: String(meta.status ?? note.status),
      due: closed ? undefined : String(meta.date ?? "").slice(0, 10) || note.due,
    };
  }

  let body: string | null;
  if (d.kind === "done") {
    body = editLine(note.body, todo.text, (l) => {
      const ticked = formatLoop({ ...l, done: true, doneAt: now, every: undefined });
      const happened = dated(now, d.happened);
      return [ticked, ...(happened ? [happened] : [])];
    });
    if (body !== null && oneLine(d.follow_up)) body = addFollowUp(body, oneLine(d.follow_up)!, now);
  } else if (d.kind === "drop") {
    body = editLine(note.body, todo.text, (l) => {
      const why = dated(now, d.why);
      return [
        formatLoop({ ...l, done: true, doneAt: now, every: undefined, dropped: true }),
        ...(why ? [why] : []),
      ];
    });
  } else {
    const w = dueFor(d.when, now);
    body = editLine(note.body, todo.text, (l) => [
      formatLoop({ ...l, due: w.due, outcome: w.outcome }),
    ]);
  }
  return body === null ? null : { ...note, body };
}
