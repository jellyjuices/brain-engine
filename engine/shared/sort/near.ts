import type { NearSubject, SortHits } from "./types.ts";

const MIN_NEAR_HITS = 2;
const SURE_NEAR_HITS = 3;
const SURE_RATIO = 2;

export function nearSubjects(hits: SortHits, homes: ReadonlySet<string>): NearSubject[] {
  const bySubject = new Map<string, NearSubject>();
  for (const hit of hits) {
    const path = hit.entry.subject;
    if (!homes.has(path)) continue;
    const known = bySubject.get(path) ?? { path, score: 0, count: 0 };
    known.score += hit.score;
    known.count += 1;
    bySubject.set(path, known);
  }
  return [...bySubject.values()]
    .filter((near) => near.count >= MIN_NEAR_HITS)
    .sort((a, b) => b.score - a.score || (a.path < b.path ? -1 : 1));
}

export function sureOf(top: NearSubject, next: NearSubject | undefined): boolean {
  return top.count >= SURE_NEAR_HITS && (!next || top.score >= SURE_RATIO * next.score);
}
