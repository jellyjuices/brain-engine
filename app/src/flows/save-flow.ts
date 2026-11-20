import { toast, type ToastOptions } from "@/components/toast/toast-store.ts";
import { flush, has, type OutboxItem } from "@/lib/sync/outbox.ts";
import { queuedText } from "@/lib/sync/queued-text.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { copy } from "@/content/index.ts";

export interface DoneToast extends ToastOptions {
  message: string;
}

type Done = string | DoneToast | (() => Promise<string>);

async function doneToast(done: Done): Promise<DoneToast> {
  if (typeof done === "string") return { message: done };
  if (typeof done === "function") return { message: await done() };
  return done;
}

export async function saveFlow(
  write: () => Promise<OutboxItem>,
  done: Done,
  full = false,
): Promise<boolean> {
  try {
    const item = await write();
    const result = await flush();
    void syncNow({ full });
    if (result.dropped.includes(item.id)) toast(copy.toast.rejected, { tone: "error" });
    else if (await has(item.id)) toast(queuedText(), { tone: "offline", ms: 5000 });
    else {
      const { message, ...opts } = await doneToast(done);
      toast(message, opts);
    }
    return true;
  } catch {
    toast(copy.toast.failed, { tone: "error" });
    return false;
  }
}
