import { META } from "@/lib/storage/keys.ts";
import { getMeta, setMeta } from "@/lib/storage/store.ts";

const MAX_RECENT = 6;

export async function recentSearches(): Promise<string[]> {
  try {
    const v: unknown = await getMeta<unknown>(META.recentSearches);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export async function rememberSearch(q: string): Promise<void> {
  const t = q.trim();
  if (t.length < 2) return;
  try {
    const next = [
      t,
      ...(await recentSearches()).filter((x) => x.toLowerCase() !== t.toLowerCase()),
    ].slice(0, MAX_RECENT);
    await setMeta(META.recentSearches, next);
  } catch {
    return;
  }
}
