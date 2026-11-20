import { isJapanese } from "../../../shared/search/index.ts";

const WORDS = /[\p{L}\p{N}]+/gu;
const PREFIX_COST = 0.5;
const LENGTH_SLACK = 3;

function editDistance(a: string, b: string): number {
  const x = [...a];
  const y = [...b];
  let before: number[] = [];
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const row = [i];
    for (let j = 1; j <= y.length; j++) {
      const cost = x[i - 1] === y[j - 1] ? 0 : 1;
      let best = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) best = Math.min(best, (before[j - 2] ?? 0) + 1);
      row.push(best);
    }
    before = prev;
    prev = row;
  }
  return prev[y.length] ?? 0;
}

export function typoWords(folded: string): string[] {
  return (folded.match(WORDS) ?? []).filter((word) => !isJapanese(word) && [...word].length >= 3);
}

function gapTo(word: string, candidates: readonly string[]): number {
  const size = [...word].length;
  let best = size;
  for (const candidate of candidates) {
    const chars = [...candidate];
    if (chars.length < size - LENGTH_SLACK) continue;
    if (chars.length <= size + LENGTH_SLACK) best = Math.min(best, editDistance(word, candidate));
    if (chars.length > size) best = Math.min(best, editDistance(word, chars.slice(0, size).join("")) + PREFIX_COST);
    if (best === 0) break;
  }
  return best;
}

function allowedEdits(word: string): number {
  const size = [...word].length;
  if (size < 4) return 0;
  return size < 7 ? 1 : 2;
}

export interface Closeness {
  near: number;
  fits: boolean;
}

export function closeness(queryWords: readonly string[], entryText: string): Closeness | null {
  if (!queryWords.length) return null;
  const candidates = [...new Set(entryText.match(WORDS) ?? [])];
  let near = 0;
  let fits = true;
  for (const word of queryWords) {
    const gap = gapTo(word, candidates);
    near += 1 - Math.min(1, gap / [...word].length);
    if (gap > allowedEdits(word)) fits = false;
  }
  return { near: near / queryWords.length, fits };
}
