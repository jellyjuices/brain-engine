import "fake-indexeddb/auto";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { list, remove } from "@/lib/sync/outbox.ts";
import { registerWrites } from "@/lib/sync/writes.ts";
import { IntakeScreen } from "@/screens/intake/intake.tsx";
import { unlockTestVault } from "../../helpers.ts";

const QUESTION = "What made weeks feel lighter in the past?";
const ANSWER = "Honestly the long walks with Elena on Sundays, no phone.";

function reply(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 });
}

function savedBody() {
  const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as [
    string,
    RequestInit,
  ][];
  const save = calls.find(([url]) => url === "/api/intake/save");
  return JSON.parse(String(save?.[1].body));
}

function stubSummarizer(summary: string) {
  vi.stubGlobal("Summarizer", {
    availability: async () => "available",
    create: async () => ({ summarize: async () => summary, destroy: () => undefined }),
  });
}

beforeAll(unlockTestVault);
afterEach(cleanup);

beforeEach(async () => {
  for (const item of await list()) await remove(item.id);
  registerWrites();
  vi.unstubAllGlobals();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async (url: string) =>
        url === "/api/intake/next"
          ? reply({ threads: [{ question: QUESTION, lens: "wellbeing", privacy: "full" }] })
          : reply({ path: "me/wellbeing.md" }),
      ),
  );
});

async function answerQuestion() {
  const user = userEvent.setup();
  render(<IntakeScreen />);
  await user.type(await screen.findByLabelText("Your answer"), ANSWER);
  await user.click(screen.getByRole("button", { name: "Next" }));
  return user;
}

describe("intake screen", () => {
  it("offers the phone's short line and saves it as written by Gemini Nano", async () => {
    stubSummarizer("Long walks with Elena help.");
    const user = await answerQuestion();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("No questions waiting");
    expect(savedBody()).toEqual({
      lens: "wellbeing",
      question: QUESTION,
      line: "Long walks with Elena help.",
      raw: ANSWER,
      by: "gemini-nano",
    });
  });

  it("saves an edited line as written by the owner", async () => {
    stubSummarizer("Long walks with Elena help.");
    const user = await answerQuestion();
    await user.type(screen.getByLabelText("Line to save"), " Sundays.");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("No questions waiting");
    expect(savedBody().by).toBe("owner");
  });

  it("moves a question to later and shows the next state", async () => {
    const user = userEvent.setup();
    render(<IntakeScreen />);
    await user.click(await screen.findByRole("button", { name: "Skip" }));
    expect(await screen.findByText("No questions waiting")).toBeInTheDocument();
  });

  it("says when the home server can't be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<IntakeScreen />);
    expect(await screen.findByText("Can't reach your home server")).toBeInTheDocument();
  });

  it("keeps the full answer as the line when the phone can't summarize", async () => {
    await answerQuestion();
    expect(screen.getByLabelText("Line to save")).toHaveValue(ANSWER);
  });
});
