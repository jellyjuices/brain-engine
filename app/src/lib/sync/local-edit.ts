import {
  LOOPS_HEADING,
  NOTES_HEADING,
  appendToSection,
  doneHistoryLine,
  dropDoneTodoIn,
  dropTodo,
  formatTodoLine,
  newTodoLine,
  parseTodoLine,
  reopenTodoIn,
  retextTodoIn,
  rollTodo,
  rollTodoIn,
  sectionRange,
  stopRepeatIn,
  tickTodo,
  updateTodo,
  type Outcome,
  type TodoLine,
} from "@shared/line/index.ts";
import type { StoredNote } from "@/lib/notes/model.ts";
import { splitWhen } from "@/lib/notes/when.ts";

export type Decision =
  | { kind: "done"; happened?: string; follow_up?: string }
  | { kind: "move"; when: string; who?: string; what?: string }
  | { kind: "drop"; why?: string }
  | { kind: "reopen" }
  | { kind: "skip" }
  | { kind: "stopRepeat" }
  | { kind: "edit"; text: string };

export interface TodoRef {
  text: string;
  path: string;
  subject: string;
  kind: "todo" | "event";
  ref: string;
  due?: string;
  every?: string;
}

function oneLine(t: string | undefined) {
  return t?.replace(/\s*\n\s*/g, " ").trim() || undefined;
}
function dated(now: string, t: string | undefined) {
  return oneLine(t) ? `- ${now} · ${oneLine(t)}` : undefined;
}

function editLine(body: string, text: string, fn: (l: TodoLine) => string[]): string | null {
  const lines = body.split("\n");
  const r = sectionRange(lines, LOOPS_HEADING);
  if (!r) return null;
  for (let i = r[0]; i < r[1]; i++) {
    const l = parseTodoLine(lines[i]!);
    if (l && !l.done && l.text === text) {
      lines.splice(i, 1, ...fn(l));
      return lines.join("\n");
    }
  }
  return null;
}

function dueFor(when: string, now: string): { due?: string; outcome?: Outcome } {
  if (when === "someday") return { outcome: "someday" };
  if (when === "waiting") return { outcome: "waiting" };
  return { due: when === "today" ? now : when };
}

function addFollowUp(body: string, text: string, now: string): string {
  const { when, text: t } = splitWhen(text, now);
  if (when?.kind === "note") return appendToSection(body, NOTES_HEADING, `- ${now} · ${t}`);
  const w: { due?: string; outcome?: Outcome } = when ?? { due: now };
  return appendToSection(
    body,
    LOOPS_HEADING,
    newTodoLine({ text: t, due: w.due, outcome: w.outcome }),
  );
}

function rewriteRef(body: string, text: string, d: Decision, now: string): string | null {
  if (d.kind === "reopen") return reopenTodoIn(body, text);
  if (d.kind === "edit") return retextTodoIn(body, text, d.text);
  if (d.kind === "skip") return rollTodoIn(body, text, now, false);
  return stopRepeatIn(body, text);
}

function doneLines(l: TodoLine, now: string, happened: string | undefined): string[] {
  const note = dated(now, happened);
  const rolled = rollTodo(l, now);
  const head = rolled
    ? [formatTodoLine(rolled), doneHistoryLine(l.text, now)]
    : [formatTodoLine(tickTodo(l, now))];
  return [...head, ...(note ? [note] : [])];
}

type LineDecision = Extract<Decision, { kind: "done" | "drop" | "move" }>;
type RefDecision = Exclude<Decision, LineDecision>;

const REF_KINDS = new Set<Decision["kind"]>(["reopen", "edit", "skip", "stopRepeat"]);

function isRefDecision(d: Decision): d is RefDecision {
  return REF_KINDS.has(d.kind);
}

function eventMeta(
  meta: StoredNote["meta"],
  d: LineDecision,
  now: string,
): StoredNote["meta"] | null {
  if (d.kind === "done") return { ...meta, status: "done" };
  if (d.kind === "drop") return { ...meta, status: "cancelled" };
  const due = dueFor(d.when, now).due;
  return due ? { ...meta, date: due } : null;
}

function applyToEvent(note: StoredNote, d: LineDecision, now: string): StoredNote | null {
  const meta = eventMeta(note.meta, d, now);
  if (!meta) return null;
  const closed = meta.status === "done" || meta.status === "cancelled";
  return {
    ...note,
    meta,
    status: String(meta.status ?? note.status),
    due: closed ? undefined : String(meta.date ?? "").slice(0, 10) || note.due,
  };
}

function doneBody(
  body: string,
  text: string,
  d: { happened?: string; follow_up?: string },
  now: string,
) {
  const edited = editLine(body, text, (l) => doneLines(l, now, d.happened));
  const follow = oneLine(d.follow_up);
  return edited !== null && follow ? addFollowUp(edited, follow, now) : edited;
}

function dropBody(body: string, text: string, why: string | undefined, now: string) {
  const reason = dated(now, why);
  const edited = editLine(body, text, (l) => [
    formatTodoLine(dropTodo(l, now)),
    ...(reason ? [reason] : []),
  ]);
  return edited ?? dropDoneTodoIn(body, text);
}

function moveBody(body: string, text: string, when: string, now: string) {
  const w = dueFor(when, now);
  return editLine(body, text, (l) => [
    formatTodoLine(updateTodo(l, { due: w.due, outcome: w.outcome })),
  ]);
}

function lineBody(body: string, text: string, d: LineDecision, now: string): string | null {
  if (d.kind === "done") return doneBody(body, text, d, now);
  if (d.kind === "drop") return dropBody(body, text, d.why, now);
  return moveBody(body, text, d.when, now);
}

function withBody(note: StoredNote, body: string | null): StoredNote | null {
  return body === null ? null : { ...note, body };
}

export function applyDecision(
  note: StoredNote,
  todo: TodoRef,
  d: Decision,
  now: string,
): StoredNote | null {
  const isEvent = todo.kind === "event";
  if (isRefDecision(d))
    return isEvent ? null : withBody(note, rewriteRef(note.body, todo.text, d, now));
  if (isEvent) return applyToEvent(note, d, now);
  return withBody(note, lineBody(note.body, todo.text, d, now));
}
