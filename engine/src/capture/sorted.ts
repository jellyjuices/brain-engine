import { posix } from "node:path";
import { statSync } from "node:fs";
import { join } from "node:path";
import {
  appendToSection,
  fieldsOf,
  formatTodoLine,
  LOOPS_HEADING,
  NOTES_HEADING,
  parseTodoLine,
  SEP,
  updateTodo,
} from "../../shared/line/index.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { changeFiles, readLog } from "../core/log.ts";
import { folderOf, LOG_FILE, type Note, titleOf, typeOf } from "../core/notes.ts";
import type { SortedLine, SortedSubject } from "../interface/api-types-sorted.ts";

type Filed = { path: string; line: string };
const filedCache = new Map<string, { key: string; filed: Filed[] }>();

const NOTE_LINE = /^- (\d{4}-\d{2}-\d{2}) · (.+)$/u;
const FILED_BY = /^(added to |sorted |moved to )/;
const LINK_TARGET = /\]\(([^)\s]+)\)/g;

export function describeLine(line: string): SortedLine | null {
  const todo = parseTodoLine(line);
  if (todo) return { line, text: todo.text, kind: "to-do", check: !!fieldsOf(todo).check };
  const match = line.match(NOTE_LINE);
  if (!match) return null;
  const parts = match[2].split(SEP).map((p) => p.trim());
  const feeling = parts[0] === "feeling";
  const text = parts[feeling ? 1 : 0] ?? "";
  return { line, text, kind: feeling ? "feeling" : "fact", check: parts.slice(feeling ? 2 : 1).includes("check") };
}

function filedLines(root: string): Filed[] {
  const stat = statSync(join(root, LOG_FILE), { throwIfNoEntry: false });
  const key = stat ? `${stat.size}:${stat.mtimeMs}` : "none";
  const hit = filedCache.get(root);
  if (hit?.key === key) return hit.filed;
  const filed = readFiled(root);
  filedCache.set(root, { key, filed });
  return filed;
}

function readFiled(root: string): Filed[] {
  const entries = readLog(root);
  const undone = new Set(entries.flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const seen = new Set<string>();
  const out: { path: string; line: string }[] = [];
  for (const e of entries) {
    if (!e.undo || !FILED_BY.test(e.msg) || (e.id && undone.has(e.id))) continue;
    for (const step of e.undo) {
      if (step.file === "gone" || step.path.startsWith("inbox/")) continue;
      for (const line of step.added) {
        const key = `${step.path}\n${line}`;
        if (seen.has(key) || !describeLine(line)) continue;
        seen.add(key);
        out.push({ path: step.path, line });
      }
    }
  }
  return out;
}

export function sortedLines(root: string): SortedSubject[] {
  const notes = new Map(loadAll(root).map((n) => [n.path, n]));
  const bySubject = new Map<string, SortedSubject>();
  for (const f of filedLines(root)) {
    const note = notes.get(f.path);
    if (!note || folderOf(note) === "inbox" || typeOf(note) === "Capture" || !note.body.split("\n").includes(f.line)) continue;
    const subject = bySubject.get(f.path) ?? { path: f.path, title: titleOf(note), lines: [] };
    subject.lines.push(describeLine(f.line)!);
    bySubject.set(f.path, subject);
  }
  return [...bySubject.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function rebased(line: string, from: string, into: string): string {
  return line.replace(LINK_TARGET, (all, target: string) => {
    if (/^([a-z]+:|#|\/)/i.test(target)) return all;
    const abs = posix.join(posix.dirname(from), target);
    return `](${posix.relative(posix.dirname(into), abs)})`;
  });
}

function checked(line: string): string {
  const todo = parseTodoLine(line);
  if (todo) return formatTodoLine(updateTodo(todo, { check: undefined }));
  const match = line.match(NOTE_LINE)!;
  const parts = match[2].split(SEP).map((p) => p.trim());
  const at = parts[0] === "feeling" ? 2 : 1;
  return `- ${match[1]}${SEP}${[...parts.slice(0, at), ...parts.slice(at).filter((p) => p !== "check")].join(SEP)}`;
}

function removeLine(note: Note, line: string): string {
  const lines = note.body.split("\n");
  const at = lines.indexOf(line);
  if (at === -1) throw new Error(`That line is not in ${note.path}.`);
  lines.splice(at, 1);
  return lines.join("\n");
}

export function moveLine(root: string, from: string, line: string, into: string): { line: string; into: string } {
  if (from === into) throw new Error("That line is in that subject already.");
  const info = describeLine(line);
  if (!info) throw new Error("That is not a to-do or a note line.");
  const source = readNote(root, from);
  const target = readNote(root, into);
  const body = removeLine(source, line);
  const moved = rebased(checked(line), from, into);
  const heading = info.kind === "to-do" ? LOOPS_HEADING : NOTES_HEADING;
  changeFiles(root, [from, into], `moved to ${into}: ${info.text}`, () => {
    writeNote(root, from, source.meta, body);
    writeNote(root, into, target.meta, appendToSection(target.body, heading, moved));
  });
  return { line: moved, into };
}
