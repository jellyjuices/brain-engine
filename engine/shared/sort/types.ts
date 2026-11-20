import type { Hit } from "../search/rank.ts";

export interface SortSubject {
  path: string;
  type: string;
  title: string;
  aliases: readonly string[];
}

export type SortHow = "named" | "near" | "none";

export interface SortGuess {
  into: string | null;
  how: SortHow;
  sure: boolean;
  people: string[];
  re: string[];
}

export interface NearSubject {
  path: string;
  score: number;
  count: number;
}

export type SortHits = readonly Hit[];
