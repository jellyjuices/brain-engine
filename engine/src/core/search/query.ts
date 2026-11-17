import { type Embedder, loadEmbedder, meaningReady, MODEL } from "../embed.ts";

let chosen: Embedder | null | undefined;
let loading: Promise<Embedder | null> | undefined;

export function useEmbedder(embedder: Embedder | null | undefined) {
  chosen = embedder;
}

export function feedModel(): string {
  return chosen?.model ?? MODEL;
}

export async function routeEmbedder(root: string): Promise<Embedder | null> {
  if (chosen !== undefined) return chosen;
  if (!meaningReady(root)) return null;
  loading ??= loadEmbedder();
  return loading;
}
