import { areasOf, DIRS, extractLinks, folderOf, type Note, str, type Summary, titleOf, today } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import {
  appendToSection,
  fieldsOf,
  formatTodoLine,
  LOOPS_HEADING,
  newTodoLine,
  NOTES_HEADING,
  parseTodoLine,
  SEP,
  tickTodo,
  todoSectionRange,
  type TodoFields,
  type TodoPatch,
  updateTodo,
} from "../../shared/line/index.ts";
import { nextDue } from "./repeat.ts";

export function whenWord(outcome: string | undefined): string | undefined {
  if (!outcome) return undefined;
  return outcome === "waiting" ? "waiting on someone" : outcome;
}

export interface Loop extends TodoFields {
  path: string;
  subjects?: string[];
  noteTitle: string;
  area?: string;
  areas?: string[];
}

export function areasOfNote(n: Note): string[] {
  const areas = areasOf(n);
  return areas.length ? areas : n.path.startsWith("areas/") ? [n.path.slice(6, -3)] : [];
}

export const inArea = (l: Loop, area: string) => l.area === area || !!l.areas?.includes(area);

function areaFields(n: Note): Pick<Loop, "area" | "areas"> {
  const areas = areasOfNote(n);
  return { area: areas[0], ...(areas.length > 1 && { areas }) };
}

export function loopsIn(n: Note): Loop[] {
  const lines = n.body.split("\n");
  const range = todoSectionRange(lines);
  if (!range) return [];
  const out: Loop[] = [];
  for (let i = range[0]; i < range[1]; i++) {
    const line = parseTodoLine(lines[i]);
    if (!line) continue;
    const todo = fieldsOf(line);
    const subjects = [...(todo.with ?? []), ...(todo.re ?? [])].flatMap((x) => extractLinks(n.path, x));
    out.push({ ...todo, ...(subjects.length && { subjects }), path: n.path, noteTitle: titleOf(n), ...areaFields(n) });
  }
  return out;
}

export const live = (n: Note) => folderOf(n) !== DIRS.archive && str(n.meta.status) !== "deprecated";

export function allLoops(notes: Note[], opts: { done?: boolean } = {}): Loop[] {
  return notes.filter(live).flatMap(loopsIn).filter((l) => opts.done === undefined || l.done === opts.done);
}

export function loopSummary(l: Loop): Summary {
  return { path: l.path, type: "Loop", title: l.text, description: l.noteTitle, tags: [], area: l.area, status: "stable", due: l.due, outcome: l.outcome, modified: today() };
}

export function addLoop(root: string, rel: string, l: TodoPatch & { text: string }): Note {
  const note = readNote(root, rel);
  const patch = l.outcome === "today" ? { ...l, due: l.due ?? today(), outcome: undefined } : l;
  return writeNote(root, rel, note.meta, appendToSection(note.body, LOOPS_HEADING, newTodoLine(patch)));
}

export function addNoteLine(root: string, rel: string, text: string, date = today()): Note {
  const note = readNote(root, rel);
  const line = `- ${date}${SEP}${text.replace(/\s*\n\s*/g, " ").trim()}`;
  return writeNote(root, rel, note.meta, appendToSection(note.body, NOTES_HEADING, line));
}

function matchOne(root: string, words: string): Loop {
  const needle = words.toLowerCase().trim();
  if (!needle) throw new Error("Say which to-do, with words from it.");
  const hits = allLoops(loadAll(root), { done: false }).filter((l) => l.text.toLowerCase().includes(needle));
  if (!hits.length) throw new Error(`No open to-do matches "${words}".`);
  if (hits.length > 1 && !hits.every((h) => h.text === hits[0].text)) {
    throw new Error(`${hits.length} to-dos match "${words}". Use more words:\n${hits.map((h) => `  ${h.text}  (${h.path})`).join("\n")}`);
  }
  return hits[0];
}

export function completeLoop(root: string, words: string): Loop & { next?: string } {
  const hit = matchOne(root, words);
  const note = readNote(root, hit.path);
  const lines = note.body.split("\n");
  const i = lines.findIndex((line) => {
    const todo = parseTodoLine(line);
    return todo && !todo.done && todo.text === hit.text;
  });
  const open = parseTodoLine(lines[i])!;
  lines[i] = formatTodoLine(tickTodo(open, today()));
  let next: string | undefined;
  if (hit.every) {
    next = nextDue(hit.every, hit.due ?? today());
    lines.splice(i + 1, 0, formatTodoLine(updateTodo(open, { due: next })));
  }
  writeNote(root, hit.path, note.meta, lines.join("\n"));
  log(root, `done: ${hit.text} (${hit.path})${next ? `, next due ${next}` : ""}`);
  return { ...hit, done: true, doneAt: today(), next };
}
