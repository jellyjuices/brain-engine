// The overdue question. When `brain` shows overdue items in a terminal, ask once a day:
// "N overdue: move all to today, pick, or someday?"
//
// applyOverdue takes the answer as an argument so tests and the phone API need no terminal.
// "All" and "someday" are one change each, so one `brain undo` reverses the whole batch.
// "Pick" goes item by item and reuses the single verbs, so each pick is its own undo.
//
// DECISION: asked once per day, whatever the owner answers (even Enter to leave). The date is kept in
// .brain/overdue-asked.json. Reason: asking again on every `brain` would nag.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIRS, today } from "../core/notes.ts";
import { writeAtomic } from "../core/files.ts";
import { drop, move, moveMany } from "./verbs.ts";
import { dayList, type Item } from "./day-list.ts";
import { doneWith, dropWith } from "./wrapup.ts";

const ASKED = join(DIRS.cache, "overdue-asked.json");

export type PickAction = "done" | "today" | "someday" | "drop" | "leave" | string; // string: a YYYY-MM-DD date
export type OverdueChoice = "all" | "someday" | "leave" | { pick: Record<number, PickAction> };

export function overdueItems(root: string): Item[] {
  return dayList(root).filter((x) => x.group === "overdue");
}

export function askedToday(root: string, now = today()): boolean {
  const path = join(root, ASKED);
  if (!existsSync(path)) return false;
  try { return JSON.parse(readFileSync(path, "utf8")).date === now; } catch { return false; }
}

export function markAsked(root: string, now = today()): void {
  writeAtomic(join(root, ASKED), JSON.stringify({ date: now }) + "\n");
}

/** Apply an answer to every overdue item. Returns a plain line for the owner. */
export function applyOverdue(root: string, now: string, choice: OverdueChoice): { line: string; changed: number } {
  const items = overdueItems(root);
  if (choice === "leave" || !items.length) return { line: "Left as they are.", changed: 0 };
  if (choice === "all" || choice === "someday") {
    const result = moveMany(root, items, choice === "all" ? "today" : "someday", now);
    const where = choice === "all" ? "today" : "someday";
    const skip = result.skipped.length ? ` (${result.skipped.length} dated visit${result.skipped.length > 1 ? "s" : ""} left as is)` : "";
    return { line: `Moved ${result.moved.length} to ${where}${skip} · brain undo`, changed: result.moved.length };
  }
  let changed = 0;
  for (const item of items) {
    const action = choice.pick[item.n] ?? "leave";
    if (action === "leave") continue;
    const ref = String(item.n);
    if (action === "done") doneWith(root, ref);
    else if (action === "drop") item.kind === "event" ? drop(root, ref) : dropWith(root, ref);
    else move(root, ref, action);
    changed++;
  }
  return { line: `Changed ${changed} of ${items.length} · brain undo undoes the last one`, changed };
}

/** The terminal question. Returns a line to print, or undefined if it did not ask. */
export async function askOverdue(root: string, now = today()): Promise<string | undefined> {
  const items = overdueItems(root);
  if (!items.length || askedToday(root, now)) return undefined;
  const p = await import("@clack/prompts");
  const answer = await p.select({
    message: `${items.length} overdue: move all to today, pick, or someday?`,
    options: [
      { value: "all", label: "Move all to today" },
      { value: "pick", label: "Pick one by one" },
      { value: "someday", label: "Someday" },
      { value: "leave", label: "Leave them (Enter)" },
    ],
    initialValue: "leave",
  });
  markAsked(root, now);
  if (p.isCancel(answer) || answer === "leave") return undefined;
  if (answer !== "pick") return applyOverdue(root, now, answer as "all" | "someday").line;
  const pick: Record<number, PickAction> = {};
  for (const item of items) {
    const answer = await p.select({
      message: `${item.text}${item.kind === "todo" ? ` · ${item.subject}` : ""} · due ${item.due}`,
      options: [
        { value: "leave", label: "Leave" },
        { value: "done", label: "Done" },
        { value: "today", label: "Move to today" },
        { value: "date", label: "Move to a date" },
        { value: "someday", label: "Someday" },
        { value: "drop", label: "Delete" },
      ],
    });
    if (p.isCancel(answer)) break;
    if (answer === "date") {
      const answer = await p.text({ message: "When? (YYYY-MM-DD, tomorrow, or a weekday)" });
      if (!p.isCancel(answer) && (answer as string).trim()) pick[item.n] = (answer as string).trim();
    } else pick[item.n] = answer as PickAction;
  }
  return applyOverdue(root, now, { pick }).line;
}
