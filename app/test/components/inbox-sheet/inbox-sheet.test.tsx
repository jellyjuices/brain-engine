import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { inboxSheet } from "@/components/inbox-sheet/inbox-sheet.tsx";
import { fixture, note } from "../../helpers.ts";
import { copy } from "@/content/index.ts";

vi.mock("@/hooks/use-notes.ts", () => ({ useNotes: () => fixture() }));

const capture = note("inbox/2026-11-06-1138-get-mace-kettlebell.md", "Get mace & kettlebell", {
  type: "Capture",
  title: "Get mace & kettlebell",
});

describe("inbox sheet", () => {
  it.skip("sorts a capture into a subject for today", async () => {
    const user = userEvent.setup();
    const result = inboxSheet(capture);
    await user.click(await screen.findByRole("button", { name: copy.inbox.sort }));
    await user.click(await screen.findByRole("button", { name: /Fitness/ }));
    await user.click(await screen.findByRole("button", { name: /Today/ }));
    expect(await result).toEqual({ kind: "sort", into: "areas/fitness.md", when: "today" });
  });
});
