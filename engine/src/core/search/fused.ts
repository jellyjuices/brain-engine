import type { DatabaseSync } from "node:sqlite";
import { answerCard, rank, type AnswerCard, type Hit as RankHit } from "../../../shared/search/index.ts";
import type { Summary } from "../notes.ts";
import { cardRows, entriesById, toEntry, type EntryRow } from "./entries.ts";
import { allowedNotes, type Filters, type NoteRow } from "./filters.ts";
import { stringList, wordList } from "./lists.ts";
import { hasVectors, meaningList, storedVector } from "./vectors.ts";

export type Meaning = "query" | "nearby" | "off";

export interface NoteHit extends Summary {
  snippet: string;
  score: number;
}

export interface FindOptions {
  queryVector?: ArrayLike<number> | null;
  model: string;
}

export interface FindResult {
  hits: RankHit[];
  answer: AnswerCard | null;
  notes: NoteHit[];
  meaning: Meaning;
}

const EXCERPT = 160;

function queryVectorFor(db: DatabaseSync, opts: FindOptions, seed: string | undefined): { vector: ArrayLike<number> | null; meaning: Meaning } {
  if (opts.queryVector) return { vector: opts.queryVector, meaning: "query" };
  if (!seed || !hasVectors(db, opts.model)) return { vector: null, meaning: "off" };
  const nearby = storedVector(db, opts.model, seed);
  return nearby ? { vector: nearby, meaning: "nearby" } : { vector: null, meaning: "off" };
}

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > EXCERPT ? `${flat.slice(0, EXCERPT - 1)}…` : flat;
}

function snippetFor(hit: RankHit, snippets: Map<string, string>): string {
  if (hit.entry.kind === "card") return "";
  const marked = snippets.get(hit.entry.id);
  return marked?.includes("[") ? marked.replace(/\s+/g, " ").trim() : excerpt(hit.entry.embedText);
}

function toNotes(hits: RankHit[], notes: Map<string, NoteRow>, snippets: Map<string, string>, limit: number): NoteHit[] {
  const byPath = new Map<string, { hit: NoteHit; archived: number; order: number }>();
  for (const hit of hits) {
    const path = hit.entry.subject;
    const known = byPath.get(path);
    if (known) {
      if (!known.hit.snippet) known.hit.snippet = snippetFor(hit, snippets);
      continue;
    }
    const row = notes.get(path);
    if (!row) continue;
    const summary = JSON.parse(row.summary) as Summary;
    byPath.set(path, { hit: { ...summary, snippet: snippetFor(hit, snippets), score: hit.score }, archived: row.folder === ".archive" ? 1 : 0, order: byPath.size });
  }
  return [...byPath.values()].sort((a, b) => a.archived - b.archived || a.order - b.order).slice(0, limit).map((item) => item.hit);
}

export function findIn(db: DatabaseSync, q: string, f: Filters, opts: FindOptions): FindResult {
  const notes = allowedNotes(db, f);
  const words = wordList(db, q);
  const strings = stringList(db, q);
  const { vector, meaning } = queryVectorFor(db, opts, words[0]?.id ?? strings[0]);
  const meant = vector ? meaningList(db, opts.model, vector) : [];
  const ids = [...new Set([...words.map((w) => w.id), ...strings, ...meant])];
  const rows = new Map<string, EntryRow>();
  for (const row of [...entriesById(db, ids), ...cardRows(db)]) if (notes.has(row.path)) rows.set(row.id, row);
  const keep = (list: string[]) => list.filter((id) => rows.has(id));
  const lists = [keep(words.map((w) => w.id)), keep(strings), vector ? keep(meant) : null];
  const hits = rank(q, [...rows.values()].map(toEntry), lists);
  const snippets = new Map(words.map((w) => [w.id, w.snippet]));
  return { hits, answer: answerCard(hits), notes: toNotes(hits, notes, snippets, f.limit ?? 20), meaning };
}
