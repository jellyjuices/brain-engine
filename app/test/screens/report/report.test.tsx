import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { go } from "@/lib/platform/router.ts";
import { ReportScreen } from "@/screens/report/report.tsx";

const WEEKLY = "# Weekly review, 2026-11-06\n\nInbox: 3 notes to sort.\n";

afterEach(cleanup);

beforeEach(() => {
  vi.unstubAllGlobals();
  go("/report/weekly");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify({ markdown: WEEKLY }), { status: 200 })),
  );
});

describe("report screen", () => {
  it("shows a summary made on the phone", async () => {
    vi.stubGlobal("Summarizer", {
      availability: async () => "available",
      create: async () => ({
        summarize: async () => "- Sort 3 inbox notes.",
        destroy: () => undefined,
      }),
    });
    const user = userEvent.setup();
    render(<ReportScreen />);
    await user.click(await screen.findByRole("button", { name: "Summarize on this device" }));
    expect(await screen.findByText("Sort 3 inbox notes.")).toBeInTheDocument();
  });

  it("shows only the full report when the phone can't summarize", async () => {
    render(<ReportScreen />);
    expect(await screen.findByText("Inbox: 3 notes to sort.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Summarize on this device" })).toBeNull();
  });
});
