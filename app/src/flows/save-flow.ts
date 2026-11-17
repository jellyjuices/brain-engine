import { toast } from "@/components/toast/toast-store.ts";
import { flush, has, type OutboxItem } from "@/lib/sync/outbox.ts";
import { queuedText } from "@/lib/sync/queued-text.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { copy } from "@/content/index.ts";

export async function saveFlow(
  write: () => Promise<OutboxItem>,
  done: string | (() => Promise<string>),
  full = false,
): Promise<boolean> {
  try {
    const item = await write();
    const result = await flush();
    void syncNow({ full });
    if (result.dropped.includes(item.id)) toast(copy.save.rejected, { tone: "error" });
    else if (await has(item.id)) toast(queuedText(), { tone: "offline", ms: 5000 });
    else toast(typeof done === "string" ? done : await done());
    return true;
  } catch {
    toast(copy.save.failed, { tone: "error" });
    return false;
  }
}
