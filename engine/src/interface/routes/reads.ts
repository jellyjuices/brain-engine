import { today } from "../../core/notes.ts";
import { byDue, inTodoView, TODO_VIEWS, type TodoView } from "../../../shared/todos/index.ts";
import { loadAll } from "../../core/files.ts";
import { readLog } from "../../core/log.ts";
import { find, findHits, type Filters, routeEmbedder, shortAnswer } from "../../core/search.ts";
import { buildCard, matchSubject } from "../../reports/card.ts";
import { ref } from "../../todos/day-list.ts";
import { decideByLoops } from "../../todos/decide-by.ts";
import { allLoops } from "../../todos/todos.ts";
import type { FindResponse, LogResponse, TodosResponse } from "../api-types.ts";
import { HttpError } from "../server-auth.ts";
import type { Ctx } from "../server-context.ts";

const MAX_LOG = 200;

const FILTERS = ["type", "tag", "area", "status"] as const;

export async function findRoute(c: Ctx): Promise<FindResponse> {
  const params = c.url.searchParams;
  const q = params.get("q") ?? "";
  if (!q.trim()) throw new HttpError(400, `Missing "q".`);
  const filters: Filters = { limit: params.get("limit") ? Number(params.get("limit")) : undefined };
  for (const key of FILTERS) filters[key] = params.get(key) ?? undefined;
  const result = await find(c.root, q, filters, await routeEmbedder(c.root));
  const found = { answer: shortAnswer(result.answer), meaning: result.meaning, hits: findHits(result) };
  if (FILTERS.some((key) => filters[key])) return found;
  const notes = loadAll(c.root);
  const subject = matchSubject(notes, q);
  return subject ? { card: buildCard(c.root, notes, subject), ...found } : found;
}

export function todosRoute(c: Ctx): TodosResponse {
  const view = (c.url.searchParams.get("view") ?? "today") as TodoView;
  if (!TODO_VIEWS.includes(view)) throw new HttpError(400, `"view" must be one of: ${TODO_VIEWS.join(", ")}.`);
  const now = today();
  const notes = loadAll(c.root);
  const items = [...allLoops(notes, { done: false }), ...decideByLoops(notes)]
    .filter((l) => !l.dropped && inTodoView(view, l, now))
    .sort(byDue)
    .map((l) => ({ ...l, ref: ref(l.path, l.text) }));
  return { view, date: now, items };
}

export function logRoute(c: Ctx): LogResponse {
  const n = Math.min(Number(c.url.searchParams.get("n") ?? 20) || 20, MAX_LOG);
  const undone = new Set(readLog(c.root).flatMap((e) => (e.undoes ? [e.undoes] : [])));
  const entries = readLog(c.root, n).map((e) => ({ at: e.at, msg: e.msg, ...(e.id && { id: e.id }), undoable: !!(e.id && e.undo && !undone.has(e.id)) }));
  return { entries };
}
