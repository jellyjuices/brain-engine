import {
  LOOPS_HEADING,
  fieldsOf,
  formatTodoLine,
  parseTodoLine,
  sectionRange,
  updateTodo,
} from "@shared/line/index.ts";
import { allLoops } from "./todos.ts";
import { extractLinks, type StoredNote } from "./model.ts";

export interface TodoPick {
  key: string;
  text: string;
  path?: string;
  noteTitle?: string;
}

export function openTodoPicks(notes: StoredNote[], goalPath?: string): TodoPick[] {
  return allLoops(notes, { done: false })
    .filter((l) => !goalPath || !l.toward?.some((v) => extractLinks(l.path, v).includes(goalPath)))
    .map((l) => ({
      key: `${l.path}::${l.text}`,
      text: l.text,
      path: l.path,
      noteTitle: l.noteTitle,
    }));
}

function relativePath(from: string, to: string): string {
  const down = to.split("/");
  const up = from.split("/").slice(0, -1);
  while (up.length && down.length > 1 && up[0] === down[0]) {
    up.shift();
    down.shift();
  }
  return [...up.map(() => ".."), ...down].join("/");
}

export function goalLink(from: string, goal: { path: string; title: string }): string {
  const name = goal.title.replace(/[[\]]/g, "");
  return `[${name}](${relativePath(from, goal.path)})`;
}

export function towardIn(
  body: string,
  text: string,
  from: string,
  goal: { path: string; title: string },
): string | null {
  const lines = body.split("\n");
  const range = sectionRange(lines, LOOPS_HEADING);
  if (!range) return null;
  for (let i = range[0]; i < range[1]; i++) {
    const line = parseTodoLine(lines[i]!);
    if (!line || line.done || line.text !== text) continue;
    const have = fieldsOf(line).toward ?? [];
    lines[i] = formatTodoLine(updateTodo(line, { toward: [...have, goalLink(from, goal)] }));
    return lines.join("\n");
  }
  return null;
}
