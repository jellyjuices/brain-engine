import { existsSync } from "node:fs";
import { join } from "node:path";
import { DIRS, eventDue, titleOf, today } from "../core/notes.ts";
import { loadAll, readNote } from "../core/files.ts";
import { decideByLoops } from "./decide-by.ts";
import { allLoops } from "./todos.ts";

export type Group = "overdue" | "today" | "waiting";
export interface Item {
  n: number;
  group: Group;
  kind: "todo" | "event" | "decision";
  text: string;
  path: string;
  subject: string;
  due?: string;
  every?: string;
}

const ORDER: Group[] = ["overdue", "today", "waiting"];

function groupOf(due: string | undefined, outcome: string | undefined, now: string): Group | undefined {
  if (due && due < now) return "overdue";
  if (due === now) return "today";
  if (outcome === "waiting") return "waiting";
  return undefined;
}

export function dayList(root: string): Item[] {
  const notes = loadAll(root);
  const now = today();
  const raw: Omit<Item, "n">[] = [];
  for (const todo of allLoops(notes, { done: false })) {
    const group = groupOf(todo.due, todo.outcome, now);
    if (group) raw.push({ group, kind: "todo", text: todo.text, path: todo.path, subject: todo.noteTitle, ...(todo.due && { due: todo.due }), ...(todo.every && { every: todo.every }) });
  }
  for (const todo of decideByLoops(notes)) {
    const group = groupOf(todo.due, undefined, now);
    if (group) raw.push({ group, kind: "decision", text: todo.text, path: todo.path, subject: todo.noteTitle, due: todo.due });
  }
  for (const note of notes) {
    const due = eventDue(note);
    if (!due || note.path.startsWith(DIRS.archive)) continue;
    const group = groupOf(due, undefined, now);
    if (group) raw.push({ group, kind: "event", text: titleOf(note), path: note.path, subject: titleOf(note), due });
  }
  raw.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || Number(!a.due) - Number(!b.due) || (a.due ?? "").localeCompare(b.due ?? "") || a.subject.localeCompare(b.subject));
  return raw.map((x, i) => ({ n: i + 1, ...x }));
}

const REF = "::";
export function ref(path: string, text: string): string {
  return `${path}${REF}${text}`;
}

function eventByPath(root: string, path: string): Item | undefined {
  if (path.includes("..") || path.startsWith("/") || !existsSync(join(root, path))) return undefined;
  const note = readNote(root, path);
  const due = eventDue(note);
  return due ? { n: 0, group: "today", kind: "event", text: titleOf(note), path, subject: titleOf(note), due } : undefined;
}

export function resolve(root: string, ref: string): Item {
  const needle = ref.trim();
  if (!needle) throw new Error("Say which to-do: a number from the list, or words from it.");
  const at = needle.indexOf(REF);
  if (at > 0 && needle.slice(0, at).endsWith(".md")) {
    const path = needle.slice(0, at);
    const text = needle.slice(at + REF.length).trim();
    const l = allLoops(loadAll(root), { done: false }).find((x) => x.path === path && x.text === text);
    if (!l) throw new Error(`That to-do is gone from ${path}. Refresh the menu.`);
    return { n: 0, group: "today", kind: "todo", text: l.text, path: l.path, subject: l.noteTitle, ...(l.due && { due: l.due }) };
  }
  const event = needle.endsWith(".md") ? eventByPath(root, needle) : undefined;
  if (event) return event;
  const words = needle.toLowerCase();
  const loops = allLoops(loadAll(root), { done: false }).filter((l) => l.text.toLowerCase().includes(words));
  const unique = [...new Map(loops.map((l) => [`${l.path}\n${l.text}`, l])).values()];
  if (!unique.length) throw new Error(`No open to-do matches "${ref}".`);
  if (unique.length > 1) throw new Error(`${unique.length} to-dos match "${ref}". Use more words:\n${unique.map((h) => `  ${h.text}  (${h.path})`).join("\n")}`);
  const todo = unique[0];
  return { n: 0, group: "today", kind: "todo", text: todo.text, path: todo.path, subject: todo.noteTitle, ...(todo.due && { due: todo.due }) };
}
