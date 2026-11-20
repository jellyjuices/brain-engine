import { toast } from "@/components/toast/toast-store.ts";
import { settle, undoWrite } from "@/lib/sync/changes.ts";
import { copy } from "@/content/index.ts";

export async function undoSaved(itemId: string): Promise<boolean> {
  const ok = await undoWrite(itemId);
  if (ok) {
    settle();
    toast(copy.toast.undone);
  } else toast(copy.toast.undoTooLate, { tone: "error" });
  return ok;
}
