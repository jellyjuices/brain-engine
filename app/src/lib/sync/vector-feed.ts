import { saveVectors, vectorModel, type FeedVector } from "@/lib/storage/vectors.ts";

export interface VectorFeed {
  model?: unknown;
  vectors?: unknown;
}

export type VectorFeedResult = "ok" | "refetch";

export async function applyVectorFeed(feed: VectorFeed, full: boolean): Promise<VectorFeedResult> {
  if (typeof feed.model !== "string" || !Array.isArray(feed.vectors)) return "ok";
  const isNewModel = (await vectorModel()) !== feed.model;
  if (isNewModel && !full) return "refetch";
  await saveVectors(feed.model, feed.vectors as FeedVector[], full);
  return "ok";
}
