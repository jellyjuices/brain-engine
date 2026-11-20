import { fieldsOf, parseTodoLine, sectionRange, type TodoLine } from "@shared/line/index.ts";
import { isLive, type StoredNote } from "./model.ts";

export const FILE_ASKS = ["split", "intake", "enrich"] as const;
export type FileAsk = (typeof FILE_ASKS)[number];

const INTAKE = "# Intake";
const OPENING_CHARS = 600;

export interface FoundTodo {
  note: StoredNote;
  text: string;
  due?: string;
  every?: string;
}

export function fileAsks(note: StoredNote): FileAsk[] {
  const raw = note.meta.asks;
  if (!Array.isArray(raw)) return [];
  return FILE_ASKS.filter((a) => raw.includes(a));
}

export function isFileNote(note: StoredNote): boolean {
  return (
    note.path.startsWith("resources/") &&
    (Array.isArray(note.meta.asks) || note.tags.includes("reference"))
  );
}

function fileName(note: StoredNote): string {
  return note.path.split("/").pop() ?? note.path;
}

function linking(notes: StoredNote[], file: StoredNote): StoredNote[] {
  const name = fileName(file);
  return notes.filter((n) => n.path !== file.path && isLive(n) && n.body.includes(name));
}

export function fileTodos(notes: StoredNote[], file: StoredNote): FoundTodo[] {
  const name = fileName(file);
  return linking(notes, file).flatMap((note) =>
    note.body
      .split("\n")
      .filter((line) => line.includes(name))
      .map((line) => parseTodoLine(line.trim()))
      .filter((t): t is TodoLine => t !== null && !t.done)
      .map((t) => {
        const f = fieldsOf(t);
        return { note, text: f.text, due: f.due, every: f.every };
      }),
  );
}

export function fileNotes(
  notes: StoredNote[],
  file: StoredNote,
): { note: StoredNote; lines: number }[] {
  const name = fileName(file);
  return linking(notes, file)
    .map((note) => ({
      note,
      lines: note.body
        .split("\n")
        .filter((l) => l.includes(name) && parseTodoLine(l.trim()) === null).length,
    }))
    .filter((r) => r.lines > 0);
}

export function intakeQuestions(file: StoredNote): string[] {
  const lines = file.body.split("\n");
  const range = sectionRange(lines, INTAKE);
  if (!range) return [];
  return lines
    .slice(range[0], range[1])
    .filter((l) => /^\s*-\s+\S/.test(l))
    .map((l) => l.replace(/^\s*-\s+/, "").trim());
}

export function fileText(file: StoredNote): string {
  const lines = file.body.split("\n");
  const range = sectionRange(lines, INTAKE);
  if (!range) return file.body;
  return [...lines.slice(0, Math.max(0, range[0] - 1)), ...lines.slice(range[1])].join("\n");
}

export function fileOpening(text: string): { opening: string; more: boolean } {
  if (text.length <= OPENING_CHARS) return { opening: text, more: false };
  const cut = text.lastIndexOf("\n\n", OPENING_CHARS);
  const end = cut > OPENING_CHARS / 3 ? cut : text.lastIndexOf(" ", OPENING_CHARS);
  return { opening: `${text.slice(0, end).trimEnd()}…`, more: true };
}
