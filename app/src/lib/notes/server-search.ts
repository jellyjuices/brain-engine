import type { LocalHit } from "./search.ts";
import type { Card } from "./card-types.ts";

export interface RemoteSearch {
  q: string;
  card?: Card;
  hits: LocalHit[];
}

function toHits(list: unknown): LocalHit[] {
  return (Array.isArray(list) ? (list as Record<string, unknown>[]) : []).map((x) => ({
    path: String(x.path),
    title: String(x.title ?? x.path),
    ...(typeof x.type === "string" && { type: x.type }),
    description: String(x.description ?? ""),
    snippet: typeof x.snippet === "string" ? x.snippet : "",
    score: Number(x.score ?? 0),
  }));
}

export function fromServerSearch(q: string, data: unknown): RemoteSearch {
  if (Array.isArray(data)) return { q, hits: toHits(data) };
  const d = data as { card?: Card; hits?: unknown };
  return { q, card: d.card, hits: toHits(d.hits) };
}
