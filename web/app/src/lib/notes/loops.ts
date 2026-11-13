import type { TodoRef } from "@/lib/sync/local-edit.ts";
import { extractLinks, isArchived, type StoredNote } from "./model.ts";

export const LOOPS_HEADING = "# To-dos";
const OLD_LOOPS_HEADING = "# Open loops";
export const NOTES_HEADING = "# Notes";
const SEP = " · ";
const OUTCOMES = ["today", "someday", "waiting"];
const OLD_OUTCOMES: Record<string, string | undefined> = {
  "do-now": "today",
  schedule: undefined,
  park: "someday",
  "hand-off": "waiting",
};
const LINKED = /^(with|re) (\[[^\]]*\]\([^)\s]+\))$/;

export interface LoopLine {
  text: string;
  done: boolean;
  due?: string;
  outcome?: string;
  doneAt?: string;
  every?: string;
  dropped?: boolean;
  with?: string[];
  re?: string[];
}

export interface Loop extends LoopLine {
  path: string;
  noteTitle: string;
  subjects?: string[];
}

export function parseLoopLine(line: string): LoopLine | null {
  const m = line.match(/^- \[( |x|X)\] (.+)$/);
  if (!m) return null;
  const [text = "", ...tokens] = m[2]!.split(SEP);
  const loop: LoopLine = { text: text.trim(), done: m[1] !== " " };
  const extra: string[] = [];
  for (const t of tokens.map((x) => x.trim())) {
    const due = t.match(/^due (\d{4}-\d{2}-\d{2})$/);
    const done = t.match(/^done (\d{4}-\d{2}-\d{2})$/);
    if (due) loop.due = due[1];
    else if (done) loop.doneAt = done[1];
    else if (/^every\s+\S/.test(t)) loop.every = t.slice(6).trim();
    else if (OUTCOMES.includes(t)) loop.outcome = t;
    else if (t in OLD_OUTCOMES) {
      const outcome = OLD_OUTCOMES[t];
      if (outcome) loop.outcome = outcome;
    } else if (t === "dropped") loop.dropped = true;
    else if (LINKED.test(t)) {
      const [, kind, link] = t.match(LINKED)!;
      (loop[kind as "with" | "re"] ??= []).push(link!);
    } else extra.push(t);
  }
  if (extra.length) loop.text = [loop.text, ...extra].join(SEP);
  return loop;
}

export function formatLoop(l: LoopLine): string {
  const text = l.text
    .replace(/\s*\n\s*/g, " ")
    .replaceAll(SEP, " - ")
    .trim();
  const tokens = [
    ...(l.with ?? []).map((x) => `with ${x}`),
    ...(l.re ?? []).map((x) => `re ${x}`),
    l.due && `due ${l.due}`,
    l.every && `every ${l.every}`,
    l.outcome,
    l.done && `done ${l.doneAt ?? ""}`.trim(),
    l.dropped && "dropped",
  ].filter(Boolean);
  return `- [${l.done ? "x" : " "}] ${[text, ...tokens].join(SEP)}`;
}

export function sectionRange(lines: string[], heading: string): [number, number] | null {
  const h = lines.findIndex((l) => l.trim() === heading);
  if (h === -1) return null;
  let end = lines.length;
  for (let i = h + 1; i < lines.length; i++)
    if (lines[i]!.startsWith("# ")) {
      end = i;
      break;
    }
  return [h + 1, end];
}

export function loopsIn(n: StoredNote): (Loop & { line: number })[] {
  const lines = n.body.split("\n");
  const r = sectionRange(lines, LOOPS_HEADING) ?? sectionRange(lines, OLD_LOOPS_HEADING);
  if (!r) return [];
  const out: (Loop & { line: number })[] = [];
  for (let i = r[0]; i < r[1]; i++) {
    const l = parseLoopLine(lines[i]!);
    if (!l) continue;
    const subjects = [...(l.with ?? []), ...(l.re ?? [])].flatMap((x) => extractLinks(n.path, x));
    out.push({
      ...l,
      ...(subjects.length && { subjects }),
      path: n.path,
      noteTitle: n.title,
      line: i,
    });
  }
  return out;
}

export function allLoops(notes: StoredNote[], opts: { done?: boolean } = {}): Loop[] {
  return notes
    .filter((n) => !isArchived(n) && n.status !== "deprecated")
    .flatMap(loopsIn)
    .filter((l) => opts.done === undefined || l.done === opts.done);
}

export function appendToSection(body: string, heading: string, line: string): string {
  const lines = body.replace(/\s+$/, "").split("\n");
  const r = sectionRange(lines, heading);
  if (!r) return `${lines.join("\n")}\n\n${heading}\n\n${line}\n`;
  let at = r[1];
  while (at > r[0] && lines[at - 1]!.trim() === "") at--;
  lines.splice(at, 0, ...(at === r[0] ? ["", line] : [line]));
  return lines.join("\n") + "\n";
}

export function todoRef(path: string, text: string) {
  return `${path}::${text}`;
}

export interface TodoSource {
  text: string;
  path: string;
  subject: string;
  kind?: TodoRef["kind"];
  ref?: string;
  due?: string | null;
}

export function makeTodo({ text, path, subject, kind, ref, due }: TodoSource): TodoRef {
  return {
    text,
    path,
    subject,
    kind: kind ?? "todo",
    ref: ref ?? todoRef(path, text),
    ...(due && { due }),
  };
}
