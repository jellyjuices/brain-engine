import { syncState } from "./sync.ts";
import { copy } from "@/content/index.ts";

export function isOffline(): boolean {
  return !navigator.onLine || syncState().offline;
}

export function queuedText(): string {
  return isOffline() ? copy.save.savedOffline : copy.save.savedRetry;
}
