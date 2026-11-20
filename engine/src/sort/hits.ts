import type { DatabaseSync } from "node:sqlite";
import { rank, type Hit } from "../../shared/search/index.ts";
import { sortWords } from "../../shared/sort/index.ts";
import { MODEL, queryVector, type Embedder } from "../core/embed.ts";
import { updateIndex } from "../core/search.ts";
import { entriesById, toEntry } from "../core/search/entries.ts";
import { openIndex } from "../core/search/schema.ts";
import { meaningList } from "../core/search/vectors.ts";

const LIST_SIZE = 100;

function anyWordList(db: DatabaseSync, words: readonly string[]): string[] {
  if (!words.length) return [];
  const match = words.map((word) => `"${word}"`).join(" OR ");
  const rows = db.prepare("SELECT id FROM words WHERE words MATCH ? ORDER BY bm25(words, 0, 10.0, 1.0) LIMIT ?").all(match, LIST_SIZE) as { id: string }[];
  return rows.map((row) => row.id);
}

export async function sortHits(root: string, text: string, embedder: Embedder | null): Promise<Hit[]> {
  const words = sortWords(text);
  if (!words.length) return [];
  const vector = await queryVector(embedder, text);
  updateIndex(root);
  const db = openIndex(root);
  try {
    const wordIds = anyWordList(db, words);
    const meant = vector ? meaningList(db, embedder?.model ?? MODEL, vector) : null;
    const entries = entriesById(db, [...new Set([...wordIds, ...(meant ?? [])])]).map(toEntry);
    return rank(text, entries, [wordIds, meant]);
  } finally {
    db.close();
  }
}
