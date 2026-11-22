import type { GoalView } from "@shared/todos/index.ts";
import { goalRefsOf, isGoalView } from "@/lib/notes/goals.ts";
import { api } from "./api.ts";
import { failed, type Loaded } from "./loaded.ts";

function goalUrl(path: string) {
  return `/api/goals/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function fetchGoal(path: string): Promise<Loaded<GoalView>> {
  const res = await api(goalUrl(path));
  if (res.ok) return isGoalView(res.data) ? { kind: "ready", data: res.data } : { kind: "error" };
  return failed(res);
}

export async function fetchGoals(): Promise<Loaded<GoalView[]>> {
  const res = await api("/api/goals");
  if (!res.ok) return failed(res);
  const refs = goalRefsOf(res.data) ?? [];
  const views = await Promise.all(refs.map((ref) => fetchGoal(ref.path)));
  if (views.some((v) => v.kind === "offline")) return { kind: "offline" };
  if (views.some((v) => v.kind === "error")) return { kind: "error" };
  return {
    kind: "ready",
    data: views.flatMap((v) => (v.kind === "ready" ? [v.data] : [])),
  };
}
