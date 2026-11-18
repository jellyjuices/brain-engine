import { fieldsOf, updateTodo } from "./fields.ts";
import { formatTodoLine, parseTodoLine, type TodoLine } from "./line.ts";

export function reopenTodo(todo: TodoLine): TodoLine {
  return updateTodo(todo, { done: false, doneAt: undefined, dropped: undefined });
}

function findTodo(lines: string[], text: string, done: boolean): number {
  return lines.findIndex((line) => {
    const todo = parseTodoLine(line);
    return todo !== null && todo.done === done && todo.text === text;
  });
}

function isNoteOn(line: string | undefined, date: string | undefined): boolean {
  return date !== undefined && line !== undefined && line.startsWith(`- ${date} · `);
}

export function reopenTodoIn(body: string, text: string): string | null {
  const lines = body.split("\n");
  const at = findTodo(lines, text, true);
  if (at === -1) return null;
  const todo = parseTodoLine(lines[at]!)!;
  const noteLines = isNoteOn(lines[at + 1], fieldsOf(todo).doneAt) ? 2 : 1;
  lines.splice(at, noteLines, formatTodoLine(reopenTodo(todo)));
  return lines.join("\n");
}

export function dropDoneTodoIn(body: string, text: string): string | null {
  const lines = body.split("\n");
  if (findTodo(lines, text, false) !== -1) return null;
  const at = findTodo(lines, text, true);
  if (at === -1) return null;
  lines[at] = formatTodoLine(updateTodo(parseTodoLine(lines[at]!)!, { dropped: true }));
  return lines.join("\n");
}

export function retextTodoIn(body: string, text: string, next: string): string | null {
  const lines = body.split("\n");
  const open = findTodo(lines, text, false);
  const at = open === -1 ? findTodo(lines, text, true) : open;
  if (at === -1) return null;
  const todo = updateTodo(parseTodoLine(lines[at]!)!, { text: next });
  if (!todo.text) return null;
  lines[at] = formatTodoLine(todo);
  return lines.join("\n");
}
