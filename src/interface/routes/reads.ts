// Find, the to-do views and the log.

import { addDays, today } from "../../core/notes.ts";
import { loadAll } from "../../core/files.ts";
import { readLog } from "../../core/log.ts";
import { search } from "../../core/search.ts";
import { buildCard, matchSubject } from "../../reports/card.ts";
import { ref } from "../../todos/day-list.ts";
import { allLoops, type Loop } from "../../todos/todos.ts";
import { type FindResponse, type LogResponse, TODO_VIEWS, type TodosResponse, type TodoView } from "../api-types.ts";
import { HttpError } from "../server-auth.ts";
import type { Ctx } from "../server-context.ts";

const SOON_DAYS = 14;
const MAX_LOG = 200;

/** The subject card when the words name one, and the hits either way. */
export function findRoute(c: Ctx): FindResponse {
  const q = c.url.searchParams.get("q") ?? "";
  if (!q.trim()) throw new HttpError(400, `Missing "q".`);
  const limit = c.url.searchParams.get("limit") ? Number(c.url.searchParams.get("limit")) : undefined;
  const hits = search(c.root, q, { limit });
  const notes = loadAll(c.root);
  const subject = matchSubject(notes, q);
  return subject ? { card: buildCard(c.root, notes, subject), hits } : { hits };
}

const VIEW: Record<TodoView, (l: Loop, now: string) => boolean> = {
  today: (l, now) => !!l.due && l.due <= now,
  soon: (l, now) => !!l.due && l.due > now && l.due <= addDays(now, SOON_DAYS),
  "no-date": (l) => !l.due && l.outcome !== "waiting",
  "on-hold": (l) => l.outcome === "waiting",
  "by-goal": (l) => !!l.toward?.length,
  all: () => true,
};

/** One standard view of the open to-dos. Today reads `due` only, never a `· today` token. */
export function todosRoute(c: Ctx): TodosResponse {
  const view = (c.url.searchParams.get("view") ?? "today") as TodoView;
  if (!TODO_VIEWS.includes(view)) throw new HttpError(400, `"view" must be one of: ${TODO_VIEWS.join(", ")}.`);
  const now = today();
  const items = allLoops(loadAll(c.root), { done: false })
    .filter((l) => !l.dropped && VIEW[view](l, now))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999") || a.text.localeCompare(b.text))
    .map((l) => ({ ...l, ref: ref(l.path, l.text) }));
  return { view, date: now, items };
}

export function logRoute(c: Ctx): LogResponse {
  const n = Math.min(Number(c.url.searchParams.get("n") ?? 20) || 20, MAX_LOG);
  const undone = new Set(readLog(c.root).flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const entries = readLog(c.root, n).map((e) => ({ at: e.at, msg: e.msg, ...(e.id && { id: e.id }), undoable: !!(e.id && e.undo && !undone.has(e.id)) }));
  return { entries };
}
