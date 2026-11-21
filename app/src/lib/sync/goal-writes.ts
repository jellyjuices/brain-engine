import { api } from "./api.ts";
import { enqueue, registerHandler } from "./outbox.ts";
import type { GoalRequest } from "@/lib/notes/goal-draft.ts";

export function registerGoalWrites() {
  registerHandler("goal", (item) => api("/api/notes", { body: item.payload as GoalRequest }));
}

export function queueGoal(request: GoalRequest) {
  return enqueue<GoalRequest>("goal", request);
}
