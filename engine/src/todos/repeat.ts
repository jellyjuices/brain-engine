import { today } from "../core/notes.ts";
import { readNote } from "../core/files.ts";
import { fieldsOf, parseTodoLine, rollTodoIn, stopRepeatIn } from "../../shared/line/index.ts";
import { rewrite, splitRef } from "./reopen.ts";

function dueOf(root: string, path: string, text: string): string | undefined {
  const todo = readNote(root, path)
    .body.split("\n")
    .map((line) => parseTodoLine(line))
    .find((l) => l !== null && !l.done && l.text === text);
  return todo ? fieldsOf(todo).due : undefined;
}

export function skip(root: string, ref: string): { path: string; text: string; next?: string; line: string } {
  const { path, text } = splitRef(root, ref);
  rewrite(root, path, `skip: ${text} (${path})`, (body) => rollTodoIn(body, text, today(), false), `"${text}" is not a repeating to-do in ${path}.`);
  const next = dueOf(root, path, text);
  return { path, text, next, line: `Skipped: ${text} · next due ${next} · undo` };
}

export function stopRepeat(root: string, ref: string): { path: string; text: string; line: string } {
  const { path, text } = splitRef(root, ref);
  rewrite(root, path, `stop repeat: ${text} (${path})`, (body) => stopRepeatIn(body, text), `"${text}" is not a repeating to-do in ${path}.`);
  return { path, text, line: `Stopped repeating: ${text} · undo` };
}
