import { loadAll } from "../../core/files.ts";
import { decisionView } from "../../reports/decisions.ts";
import { goalList, goalView } from "../../reports/goals.ts";
import type { DecisionResponse, GoalResponse, GoalsResponse } from "../api-types.ts";
import { HttpError } from "../server-auth.ts";
import type { Ctx } from "../server-context.ts";

function pathOf(rest: string, dir: string): string {
  let raw: string;
  try {
    raw = decodeURIComponent(rest);
  } catch {
    throw new HttpError(400, "That path is not valid.");
  }
  if (!raw || raw.includes("..")) throw new HttpError(400, "Say which note: a slug or a path.");
  return raw.endsWith(".md") ? raw : `${dir}/${raw}.md`;
}

export function goalsRoute(c: Ctx): GoalsResponse {
  return { goals: goalList(loadAll(c.root)) };
}

export function goalRoute(c: Ctx, rest: string): GoalResponse {
  const view = goalView(loadAll(c.root), pathOf(rest, "goals"));
  if (!view) throw new HttpError(404, `No goal at ${rest}.`);
  return view;
}

export function decisionRoute(c: Ctx, rest: string): DecisionResponse {
  const view = decisionView(loadAll(c.root), pathOf(rest, "decisions"));
  if (!view) throw new HttpError(404, `No decision at ${rest}.`);
  return view;
}
