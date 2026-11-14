import type { AnswerCard, EntryKind } from "../../../shared/search/index.ts";
import type { FindResult } from "./fused.ts";

export interface FindHit {
  path: string;
  title: string;
  type?: string;
  kind: EntryKind;
  line: number;
  date: string | null;
  done: boolean | null;
  snippet: string;
  score: number;
}

const ANSWER_CHARS = 280;

export function shortAnswer(answer: AnswerCard | null): AnswerCard | null {
  if (!answer) return null;
  const flat = answer.text.replace(/\s+/g, " ").trim();
  return { ...answer, text: flat.length > ANSWER_CHARS ? `${flat.slice(0, ANSWER_CHARS - 1)}…` : flat };
}

export function findHits(result: FindResult): FindHit[] {
  const best = new Map<string, FindResult["hits"][number]>();
  for (const hit of result.hits) if (!best.has(hit.entry.subject)) best.set(hit.entry.subject, hit);
  return result.notes.map((note) => {
    const entry = best.get(note.path)?.entry;
    return {
      path: note.path, title: note.title, ...(note.type && { type: note.type }),
      kind: entry?.kind ?? "card", line: entry?.line ?? 1, date: entry?.date ?? null, done: entry?.done ?? null,
      snippet: note.snippet, score: Number(note.score.toFixed(5)),
    };
  });
}
