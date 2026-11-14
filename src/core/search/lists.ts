import type { DatabaseSync } from "node:sqlite";
import { fold, isJapanese } from "../../../shared/search/index.ts";
import { closeness, typoWords } from "./typo.ts";

const LIST_SIZE = 200;
const MIN_TRIGRAM_SHARE = 0.5;
const SHORT_SHARE = 0.75;

export interface WordHit {
  id: string;
  snippet: string;
}

const WORDS = /[\p{L}\p{N}]+/gu;
const HAS_JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

export function ftsQuery(q: string): string {
  const words = q.match(WORDS) ?? [];
  return words.map((w, i) => `"${w}"${i === words.length - 1 ? "*" : ""}`).join(" ");
}

export function wordList(db: DatabaseSync, q: string): WordHit[] {
  const match = ftsQuery(q);
  if (!match) return [];
  return db
    .prepare("SELECT id, snippet(words, 2, '[', ']', ' … ', 12) AS snippet FROM words WHERE words MATCH ? ORDER BY bm25(words, 0, 10.0, 1.0) LIMIT ?")
    .all(match, LIST_SIZE) as unknown as WordHit[];
}

function trigrams(q: string): string[] {
  const grams = new Set<string>();
  for (const word of fold(q).match(WORDS) ?? []) {
    const chars = [...word];
    for (let i = 0; i + 3 <= chars.length; i++) grams.add(chars.slice(i, i + 3).join(""));
  }
  return [...grams];
}

function likeList(db: DatabaseSync, q: string): string[] {
  const needle = q.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  return (db.prepare("SELECT id FROM entries WHERE text LIKE ? ESCAPE '\\' OR names LIKE ? ESCAPE '\\' ORDER BY date DESC LIMIT ?").all(`%${needle}%`, `%${needle}%`, LIST_SIZE) as { id: string }[]).map((row) => row.id);
}

function isShortJapanese(q: string): boolean {
  const chars = [...q.trim()];
  return chars.length > 0 && chars.length < 3 && HAS_JAPANESE.test(q) && chars.every((c) => isJapanese(c) || /\s/.test(c));
}

function minShare(grams: number): number {
  if (grams <= 2) return 1;
  return grams <= 4 ? SHORT_SHARE : MIN_TRIGRAM_SHARE;
}

export function stringList(db: DatabaseSync, q: string): string[] {
  if (isShortJapanese(q)) return likeList(db, q);
  const grams = trigrams(q);
  if (!grams.length) return [];
  const match = grams.map((gram) => `"${gram}"`).join(" OR ");
  const rows = db.prepare("SELECT id, text FROM strings WHERE strings MATCH ? ORDER BY rank LIMIT ?").all(match, LIST_SIZE * 2) as { id: string; text: string }[];
  const queryWords = typoWords(fold(q));
  const need = minShare(grams.length);
  return rows
    .map((row, order) => {
      const text = fold(row.text);
      const share = grams.filter((gram) => text.includes(gram)).length / grams.length;
      const close = closeness(queryWords, text);
      return { id: row.id, order, share, fits: share >= need || !!close?.fits, score: share + (close?.near ?? share) };
    })
    .filter((row) => row.share > 0 && row.fits)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, LIST_SIZE)
    .map((row) => row.id);
}
