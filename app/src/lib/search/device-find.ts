import { answerCard, rank, type AnswerCard, type Hit } from "@shared/search/index.ts";
import { foundNotes, type FoundNote } from "./found-notes.ts";
import { nearList, type VectorMap } from "./vectors.ts";
import type { WordIndex } from "./word-index.ts";

export interface DeviceFind {
  q: string;
  hits: Hit[];
  answer: AnswerCard | null;
  notes: FoundNote[];
}

function meaningList(
  index: WordIndex,
  words: readonly string[],
  vectors: VectorMap,
  queryVector: Int8Array | null,
): string[] | null {
  if (!vectors.size) return null;
  const anchor = queryVector ?? vectors.get(words[0] ?? "")?.vec;
  return anchor ? nearList(anchor, vectors, (id) => index.entry(id) !== undefined) : null;
}

export function findIn(
  index: WordIndex,
  q: string,
  vectors: VectorMap,
  queryVector: Int8Array | null,
): DeviceFind {
  const words = index.words(q);
  const meaning = meaningList(index, words, vectors, queryVector);
  const hits = rank(q, index.entries(), [words, meaning]);
  return { q, hits, answer: answerCard(hits), notes: foundNotes(hits, index) };
}
