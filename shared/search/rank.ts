import { fold } from "./fold.ts";
import type { Entry } from "./types.ts";

export const RRF_K = 60;
export const NO_NAME = 3;

export type RankedList = readonly string[];

export interface Hit {
  entry: Entry;
  score: number;
  tier: number;
}

export interface AnswerCard {
  id: string;
  text: string;
  date: string | null;
  path: string;
  line: number;
}

function words(text: string): string {
  return fold(text)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function fuse(lists: readonly (RankedList | null | undefined)[], k = RRF_K): Map<string, number> {
  const scores = new Map<string, number>();
  for (const list of lists) {
    const seen = new Set<string>();
    (list ?? []).forEach((id, index) => {
      if (seen.has(id)) return;
      seen.add(id);
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + index + 1));
    });
  }
  return scores;
}

export function nameTier(query: string, title: string, names: readonly string[]): number {
  const want = words(query);
  if (!want) return NO_NAME;
  const all = [title, ...names].map(words);
  if (all.some((name) => name === want)) return 0;
  if (all.some((name) => name.startsWith(want))) return 1;
  if (all.some((name) => ` ${name}`.includes(` ${want}`))) return 2;
  return NO_NAME;
}

function newestFirst(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? 1 : -1;
}

function compareHits(a: Hit, b: Hit): number {
  return a.tier - b.tier || b.score - a.score || newestFirst(a.entry.date, b.entry.date) || (a.entry.id < b.entry.id ? -1 : 1);
}

export function rank(query: string, entries: readonly Entry[], lists: readonly (RankedList | null | undefined)[], k = RRF_K): Hit[] {
  const scores = fuse(lists, k);
  const hits = entries.flatMap((entry) => {
    const tier = entry.kind === "card" ? nameTier(query, entry.title, entry.names) : NO_NAME;
    const score = scores.get(entry.id);
    if (score === undefined && tier === NO_NAME) return [];
    return [{ entry, score: score ?? 0, tier }];
  });
  return hits.sort(compareHits);
}

export function answerCard(hits: readonly Hit[]): AnswerCard | null {
  const top = hits.find((hit) => hit.entry.kind !== "card") ?? hits[0];
  if (!top) return null;
  const { id, embedText, date, subject, line } = top.entry;
  return { id, text: embedText, date, path: subject, line };
}
