export type SummaryKind = "key-points" | "tldr" | "headline";

interface SummaryOptions {
  type: SummaryKind;
  format: "plain-text" | "markdown";
  length: "short" | "medium" | "long";
  sharedContext?: string;
}

interface OnDeviceSummarizer {
  summarize(text: string): Promise<string>;
  destroy(): void;
}

interface SummarizerApi {
  availability(
    options: SummaryOptions,
  ): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options: SummaryOptions): Promise<OnDeviceSummarizer>;
}

const SHARED_CONTEXT = "Personal notes. Keep the writer's own words. Canadian English.";

function summarizerApi(): SummarizerApi | null {
  const found = (globalThis as { Summarizer?: SummarizerApi }).Summarizer;
  return found ?? null;
}

function optionsFor(type: SummaryKind): SummaryOptions {
  return {
    type,
    format: type === "key-points" ? "markdown" : "plain-text",
    length: "short",
    sharedContext: SHARED_CONTEXT,
  };
}

export async function canSummarize(type: SummaryKind): Promise<boolean> {
  const found = summarizerApi();
  if (!found) return false;
  try {
    return (await found.availability(optionsFor(type))) !== "unavailable";
  } catch {
    return false;
  }
}

export async function summarize(text: string, type: SummaryKind): Promise<string | null> {
  const found = summarizerApi();
  if (!found || !text.trim()) return null;
  try {
    const summarizer = await found.create(optionsFor(type));
    try {
      return (await summarizer.summarize(text)).trim() || null;
    } finally {
      summarizer.destroy();
    }
  } catch {
    return null;
  }
}
