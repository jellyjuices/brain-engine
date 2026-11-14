import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIRS, eventDue, titleOf, today } from "../core/notes.ts";
import { loadAll, readNote, writeAtomic } from "../core/files.ts";
import { allLoops } from "./todos.ts";

export type Group = "overdue" | "today" | "waiting";
export interface Item {
  n: number;
  group: Group;
  kind: "todo" | "event";
  text: string;
  path: string;
  subject: string;
  due?: string;
}

const LAST_LIST = join(DIRS.cache, "last-list.json");
const ORDER: Group[] = ["overdue", "today", "waiting"];

function groupOf(due: string | undefined, outcome: string | undefined, now: string): Group | undefined {
  if (due && due < now) return "overdue";
  if (due === now) return "today";
  if (outcome === "waiting") return "waiting";
  return undefined;
}

/** Today's numbered list. Saved as the last list shown unless save is false. */
export function dayList(root: string, opts: { save?: boolean } = {}): Item[] {
  const notes = loadAll(root);
  const now = today();
  const raw: Omit<Item, "n">[] = [];
  for (const todo of allLoops(notes, { done: false })) {
    const group = groupOf(todo.due, todo.outcome, now);
    if (group) raw.push({ group, kind: "todo", text: todo.text, path: todo.path, subject: todo.noteTitle, ...(todo.due && { due: todo.due }) });
  }
  for (const note of notes) {
    const due = eventDue(note);
    if (!due || note.path.startsWith(DIRS.archive)) continue;
    const group = groupOf(due, undefined, now);
    if (group) raw.push({ group, kind: "event", text: titleOf(note), path: note.path, subject: titleOf(note), due });
  }
  raw.sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || Number(!a.due) - Number(!b.due) || (a.due ?? "").localeCompare(b.due ?? "") || a.subject.localeCompare(b.subject));
  const items = raw.map((x, i) => ({ n: i + 1, ...x }));
  if (opts.save !== false) writeAtomic(join(root, LAST_LIST), JSON.stringify(items, null, 2) + "\n");
  return items;
}

export function lastList(root: string): Item[] {
  const path = join(root, LAST_LIST);
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Item[]) : [];
}

const REF = "::";
/** A stable ref for one to-do: its note path and exact text. Menus use it because list numbers change. */
export function ref(path: string, text: string): string {
  return `${path}${REF}${text}`;
}

/** An upcoming event by its note path. Its stable ref is the path alone. */
function eventByPath(root: string, path: string): Item | undefined {
  if (path.includes("..") || path.startsWith("/") || !existsSync(join(root, path))) return undefined;
  const note = readNote(root, path);
  const due = eventDue(note);
  return due ? { n: 0, group: "today", kind: "event", text: titleOf(note), path, subject: titleOf(note), due } : undefined;
}

/** A number from the last list, words from an open to-do, a stable `path::text` ref, or an event path. */
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
  if (/^\d+$/.test(needle)) {
    const hit = lastList(root).find((x) => x.n === Number(needle));
    if (!hit) throw new Error(`No line ${needle} in the last list. Run brain to see it again.`);
    return hit;
  }
  const words = needle.toLowerCase();
  const loops = allLoops(loadAll(root), { done: false }).filter((l) => l.text.toLowerCase().includes(words));
  const unique = [...new Map(loops.map((l) => [`${l.path}\n${l.text}`, l])).values()];
  if (!unique.length) throw new Error(`No open to-do matches "${ref}".`);
  if (unique.length > 1) throw new Error(`${unique.length} to-dos match "${ref}". Use more words:\n${unique.map((h) => `  ${h.text}  (${h.path})`).join("\n")}`);
  const todo = unique[0];
  return { n: 0, group: "today", kind: "todo", text: todo.text, path: todo.path, subject: todo.noteTitle, ...(todo.due && { due: todo.due }) };
}

const HEAD: Record<Group, string> = { overdue: "Overdue", today: "Today", waiting: "Waiting on someone" };

/** The numbered list as plain lines. */
export function listLines(items: Item[]): string[] {
  if (!items.length) return ["Nothing due today. Add with: brain add \"text\""];
  const out: string[] = [];
  for (const group of ORDER) {
    const xs = items.filter((x) => x.group === group);
    if (!xs.length) continue;
    if (out.length) out.push("");
    out.push(HEAD[group]);
    for (const item of xs) out.push(`${String(item.n).padStart(3)}. ${item.text}${item.kind === "todo" ? ` · ${item.subject}` : ""}${group === "overdue" && item.due ? ` · due ${item.due}` : ""}`);
  }
  return out;
}
