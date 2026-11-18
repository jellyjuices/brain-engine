import { fieldsOf, parseTodoLine, todoSectionRange, type TodoFields } from "@shared/line/index.ts";
import type { TodoRef } from "@/lib/sync/local-edit.ts";
import { extractLinks, isArchived, type StoredNote } from "./model.ts";

export interface Loop extends TodoFields {
  path: string;
  noteTitle: string;
  subjects?: string[];
}

export function loopsIn(n: StoredNote): (Loop & { line: number })[] {
  const lines = n.body.split("\n");
  const range = todoSectionRange(lines);
  if (!range) return [];
  const out: (Loop & { line: number })[] = [];
  for (let i = range[0]; i < range[1]; i++) {
    const parsed = parseTodoLine(lines[i]!);
    if (!parsed) continue;
    const todo = fieldsOf(parsed);
    const subjects = [...(todo.with ?? []), ...(todo.re ?? [])].flatMap((x) =>
      extractLinks(n.path, x),
    );
    out.push({
      ...todo,
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
  every?: string;
}

export function makeTodo({ text, path, subject, kind, ref, due, every }: TodoSource): TodoRef {
  return {
    text,
    path,
    subject,
    kind: kind ?? "todo",
    ref: ref ?? todoRef(path, text),
    ...(due && { due }),
    ...(every && { every }),
  };
}
