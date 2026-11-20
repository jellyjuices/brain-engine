import { tokenize } from "../search/fold.ts";

const MIN_LETTERS = 3;

const STOP = new Set([
  "the", "and", "for", "with", "from", "that", "this", "these", "those", "have", "has", "had", "was", "were", "are",
  "but", "not", "you", "your", "our", "out", "off", "into", "onto", "about", "some", "any", "all", "can", "could",
  "should", "would", "will", "just", "get", "got", "need", "needs", "want", "maybe", "then", "than", "there", "here",
  "when", "what", "who", "how", "why", "too", "very", "also", "again", "back", "today", "tomorrow", "someday",
]);

export function sortWords(text: string): string[] {
  return tokenize(text).filter((word) => [...word].length >= MIN_LETTERS && !STOP.has(word));
}
