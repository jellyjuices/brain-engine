import { copy } from "@/content/index.ts";
const TIME = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit", hour12: true });

export function syncTime(iso: string): string {
  return TIME.format(new Date(iso));
}

export function syncText(s: { lastSync?: string; offline: boolean; syncing: boolean }): string {
  if (s.offline) return s.lastSync ? copy.sync.offlineWithCopy : copy.sync.offlineEmpty;
  if (s.syncing && !s.lastSync) return copy.sync.loading;
  return s.lastSync ? copy.sync.syncedAt(syncTime(s.lastSync)) : "";
}
