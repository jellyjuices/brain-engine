import { readNote, writeNote } from "../core/files.ts";
import { dropDoneTodoIn, reopenTodoIn, retextTodoIn, tidyText } from "../../shared/line/index.ts";
import { change } from "./undo.ts";
import { resolve } from "./day-list.ts";

const REF = "::";

export function splitRef(root: string, ref: string): { path: string; text: string } {
  const needle = ref.trim();
  const at = needle.indexOf(REF);
  const path = needle.slice(0, Math.max(at, 0));
  if (path.includes("..") || path.startsWith("/")) throw new Error("That to-do ref points outside the brain.");
  if (at > 0 && path.endsWith(".md")) return { path, text: needle.slice(at + REF.length).trim() };
  const item = resolve(root, needle);
  if (item.kind !== "todo") throw new Error("That is an event, not a to-do.");
  return { path: item.path, text: item.text };
}

export function rewrite(root: string, path: string, msg: string, fn: (body: string) => string | null, missing: string): void {
  const note = readNote(root, path);
  const body = fn(note.body);
  if (body === null) throw new Error(missing);
  change(root, path, msg, () => void writeNote(root, path, note.meta, body));
}

export function reopen(root: string, ref: string): { path: string; text: string; line: string } {
  const { path, text } = splitRef(root, ref);
  rewrite(root, path, `reopen: ${text} (${path})`, (body) => reopenTodoIn(body, text), `"${text}" is not a done to-do in ${path}.`);
  return { path, text, line: `Not done: ${text} · undo` };
}

export function dropDone(root: string, ref: string): { path: string; text: string; line: string } | null {
  if (!ref.includes(REF)) return null;
  const { path, text } = splitRef(root, ref);
  if (dropDoneTodoIn(readNote(root, path).body, text) === null) return null;
  rewrite(root, path, `drop: ${text} (${path})`, (body) => dropDoneTodoIn(body, text), `"${text}" is gone from ${path}.`);
  return { path, text, line: `Deleted: ${text} · undo` };
}

export function editTodoText(root: string, ref: string, next: string): { path: string; text: string; line: string } {
  const { path, text } = splitRef(root, ref);
  const words = tidyText(next);
  if (!words) throw new Error("Say the new words for the to-do.");
  rewrite(root, path, `edit: ${text} → ${words} (${path})`, (body) => retextTodoIn(body, text, words), `"${text}" is no longer in ${path}. Refresh the list.`);
  return { path, text: words, line: `Changed: ${words} · undo` };
}
