import { homedir } from "node:os";
import { join } from "node:path";
import { openIndex } from "./search/schema.ts";
import { hasVectors, pendingEntries, storeVectors } from "./search/vectors.ts";

export const MODEL = "Snowflake/snowflake-arctic-embed-xs";
const BATCH = 32;
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

export type EmbedKind = "query" | "document";

export interface Embedder {
  readonly model: string;
  embed(texts: string[], kind: EmbedKind): Promise<ArrayLike<number>[]>;
}

interface Extractor {
  (texts: string[], options: { pooling: "cls"; normalize: boolean }): Promise<{ tolist(): number[][] }>;
}

function modelDir(): string {
  const base = process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
  return join(base, "brain", "models");
}

export async function loadEmbedder(): Promise<Embedder | null> {
  if (process.env.BRAIN_EMBED === "off") return null;
  try {
    const lib = await import("@huggingface/transformers");
    lib.env.cacheDir = modelDir();
    lib.env.allowRemoteModels = process.env.BRAIN_MODEL_FETCH === "1";
    const extractor = (await lib.pipeline("feature-extraction", MODEL, { dtype: "q8" })) as unknown as Extractor;
    return {
      model: MODEL,
      async embed(texts, kind) {
        const input = kind === "query" ? texts.map((text) => QUERY_PREFIX + text) : texts;
        const output = await extractor(input, { pooling: "cls", normalize: true });
        return output.tolist();
      },
    };
  } catch {
    return null;
  }
}

export function pendingCount(root: string, model = MODEL): number {
  const db = openIndex(root);
  try {
    return pendingEntries(db, model).length;
  } finally {
    db.close();
  }
}

export function meaningReady(root: string, model = MODEL): boolean {
  const db = openIndex(root);
  try {
    return hasVectors(db, model);
  } finally {
    db.close();
  }
}

export async function meaningEmbedder(root: string): Promise<Embedder | null> {
  return meaningReady(root) ? loadEmbedder() : null;
}

export async function embedPending(root: string, embedder: Embedder, batch = BATCH): Promise<number> {
  const db = openIndex(root);
  try {
    const pending = pendingEntries(db, embedder.model);
    for (let start = 0; start < pending.length; start += batch) {
      const items = pending.slice(start, start + batch);
      const vectors = await embedder.embed(items.map((item) => item.embed), "document");
      db.exec("BEGIN");
      storeVectors(db, embedder.model, items, vectors);
      db.exec("COMMIT");
    }
    return pending.length;
  } finally {
    db.close();
  }
}

export async function queryVector(embedder: Embedder | null, q: string): Promise<ArrayLike<number> | null> {
  if (!embedder || !q.trim()) return null;
  try {
    return (await embedder.embed([q], "query"))[0] ?? null;
  } catch {
    return null;
  }
}
