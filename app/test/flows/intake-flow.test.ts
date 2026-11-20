import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveIntakeAnswer, shortenAnswer } from "@/flows/intake-flow.ts";

const summarize = vi.hoisted(() => vi.fn());
const queueIntakeSave = vi.hoisted(() => vi.fn());

vi.mock("@/lib/platform/summarizer.ts", () => ({ summarize }));
vi.mock("@/lib/sync/writes.ts", () => ({ queueIntakeSave, queueIntakeSkip: vi.fn() }));
vi.mock("@/lib/sync/outbox.ts", () => ({
  flush: vi.fn(() => Promise.resolve({ sent: ["i1"], dropped: [], left: 0 })),
  has: vi.fn(() => Promise.resolve(false)),
}));
vi.mock("@/lib/sync/sync.ts", () => ({
  syncNow: vi.fn(() => Promise.resolve()),
  syncState: () => ({ offline: false }),
}));
vi.mock("@/components/toast/toast-store.ts", () => ({ toast: vi.fn() }));

const question = {
  question: "What makes a week feel lighter?",
  lens: "wellbeing",
  privacy: "full" as const,
};
const answer = "  Honestly the long walks with Elena on Sundays.  ";
const short = "Long walks with Elena.";

beforeEach(() => {
  vi.clearAllMocks();
  queueIntakeSave.mockResolvedValue({
    id: "i1",
    kind: "intake-save",
    payload: {},
    created_at: "now",
  });
});

describe("saveIntakeAnswer", () => {
  it("an unchanged summary is saved as written by gemini-nano", async () => {
    summarize.mockResolvedValue(short);
    const draft = await shortenAnswer(answer);

    await saveIntakeAnswer(question, draft);

    expect(queueIntakeSave).toHaveBeenCalledWith({
      lens: "wellbeing",
      question: question.question,
      line: short,
      raw: answer.trim(),
      by: "gemini-nano",
    });
  });

  it("a summary the owner changed is saved as written by the owner", async () => {
    summarize.mockResolvedValue(short);
    const draft = await shortenAnswer(answer);

    await saveIntakeAnswer(question, { ...draft, line: "Sunday walks with Elena." });

    expect(queueIntakeSave).toHaveBeenCalledWith(
      expect.objectContaining({ line: "Sunday walks with Elena.", by: "owner" }),
    );
  });

  it("with no summarizer the trimmed answer is the line, written by the owner", async () => {
    summarize.mockResolvedValue(null);
    const draft = await shortenAnswer(answer);

    await saveIntakeAnswer(question, draft);

    expect(queueIntakeSave).toHaveBeenCalledWith(
      expect.objectContaining({ line: answer.trim(), by: "owner" }),
    );
  });
});
