import { goalHref } from "@/lib/notes/goals.ts";
import { goalRequest, type GoalDraft } from "@/lib/notes/goal-draft.ts";
import { go } from "@/lib/platform/router.ts";
import { queueGoal } from "@/lib/sync/goal-writes.ts";
import { has } from "@/lib/sync/outbox.ts";
import { noteAfterSync } from "./build-flow.ts";
import { saveFlow } from "./save-flow.ts";
import { copy } from "@/content/index.ts";

export async function saveGoal(draft: GoalDraft): Promise<boolean> {
  const request = goalRequest(draft);
  let id = "";
  let sent = false;
  const ok = await saveFlow(
    async () => {
      const item = await queueGoal(request);
      id = item.id;
      return item;
    },
    async () => {
      sent = true;
      return copy.sort.addedTo(copy.goals.title);
    },
  );
  if (!ok) return false;
  if (!sent) {
    if (!(await has(id))) return false;
    go("/goals", true);
    return true;
  }
  const lower = request.title.toLowerCase();
  const made = await noteAfterSync((n) => n.type === "Goal" && n.title.toLowerCase() === lower);
  go(made ? goalHref(made.path) : "/goals", true);
  return true;
}
