import { toast, type ToastOptions } from "@/components/toast/toast-store.ts";
import { flush, has, type OutboxItem } from "@/lib/sync/outbox.ts";
import { queuedText } from "@/lib/sync/queued-text.ts";
import { syncNow } from "@/lib/sync/sync.ts";
import { hasUndoId } from "@/lib/sync/undo-ids.ts";
import { undoSaved } from "./undo-flow.ts";
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

function withUndo(opts: ToastOptions, itemId: string, restore?: () => Promise<void>) {
  const { action, actions = [], ...rest } = opts;
  const undo = {
    label: copy.common.undo,
    onClick: () =>
      void undoSaved(itemId).then((ok) => {
        if (ok) return restore?.();
      }),
  };
  return { ...rest, actions: [...actions, ...(action ? [action] : []), undo] };
}

export async function saveFlow(
  write: () => Promise<OutboxItem>,
  done: Done,
  full = false,
  restore?: () => Promise<void>,
): Promise<boolean> {
  try {
    const item = await write();
    const result = await flush();
    void syncNow({ full });
    if (result.dropped.includes(item.id)) toast(copy.toast.rejected, { tone: "error" });
    else if (await has(item.id))
      toast(queuedText(), withUndo({ tone: "offline", ms: 5000 }, item.id, restore));
    else {
      const { message, ...opts } = await doneToast(done);
      toast(message, hasUndoId(item.id) ? withUndo(opts, item.id, restore) : opts);
    }
    return true;
  } catch {
    toast(copy.toast.failed, { tone: "error" });
    return false;
  }
}
