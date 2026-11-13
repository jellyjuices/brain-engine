import { beforeEach, describe, expect, it, vi } from "vitest";
import { canSummarize, summarize } from "@/lib/platform/summarizer.ts";

beforeEach(() => vi.unstubAllGlobals());

describe("summarizer", () => {
  it.each([
    ["available", true],
    ["downloadable", true],
    ["unavailable", false],
  ])("availability %s gives %s", async (state, expected) => {
    vi.stubGlobal("Summarizer", { availability: async () => state, create: vi.fn() });
    expect(await canSummarize("key-points")).toBe(expected);
  });

  it("is off when the browser has no Summarizer", async () => {
    expect(await canSummarize("tldr")).toBe(false);
  });

  it("gives null when the model fails", async () => {
    vi.stubGlobal("Summarizer", {
      availability: async () => "available",
      create: async () => {
        throw new DOMException("Model not ready", "NotAllowedError");
      },
    });
    expect(await summarize("Inbox: 3 notes to sort.", "key-points")).toBeNull();
  });
});
