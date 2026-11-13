import { META } from "./keys.ts";
import { getMeta, setMeta } from "./store.ts";

export const DRAFT_MS = 800;

export async function storeDraft<T>(id: string, value: T | null): Promise<void> {
  await setMeta(`${META.draft}${id}`, value).catch(() => {});
}

export async function readDraft<T>(id: string): Promise<T | null> {
  return (await getMeta<T | null>(`${META.draft}${id}`).catch(() => null)) ?? null;
}
