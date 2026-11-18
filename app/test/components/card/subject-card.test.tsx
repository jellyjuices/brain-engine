import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubjectCard } from "@/components/card/subject-card.tsx";
import type { Card } from "@/lib/notes/card-types.ts";
import { longDate, niceDate } from "@/lib/notes/model.ts";
import { copy } from "@/content/index.ts";
import { NOW } from "../../helpers.ts";

const PATH = "projects/garden-shed.md";

function cardWith(o: Partial<Card>): Card {
  return {
    subject: { path: PATH, title: "Garden shed", type: "Project", description: "" },
    todo: [
      { text: "Paint the door", path: PATH, noteTitle: "Garden shed" },
      { text: "Call the roofer", path: PATH, noteTitle: "Garden shed", due: "2026-11-20" },
      { text: "Order cedar boards", path: PATH, noteTitle: "Garden shed", due: "2026-11-12" },
    ],
    next: { date: "2026-11-12", text: "Order cedar boards", path: PATH },
    history: [],
    relations: [],
    related: [],
    ...o,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(`${NOW}T09:00:00`));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the Soon section on a subject card", () => {
  it("shows only the soonest to-do, once, with its date once", () => {
    render(<SubjectCard card={cardWith({})} />);
    expect(screen.getByText(copy.notes.soon)).toBeVisible();
    expect(screen.getAllByText("Order cedar boards")).toHaveLength(1);
    expect(screen.getAllByText(niceDate("2026-11-12"))).toHaveLength(1);
    expect(screen.queryByText("Call the roofer")).toBeNull();
  });

  it("with no dates, shows the first open to-do", () => {
    const todo = [{ text: "Paint the door", path: PATH, noteTitle: "Garden shed" }];
    render(<SubjectCard card={cardWith({ todo, next: undefined })} />);
    expect(screen.getByRole("checkbox", { name: "Paint the door" })).not.toBeChecked();
  });

  it("an event before every to-do shows instead, once", () => {
    const next = { date: "2026-11-10", text: "Roof inspection", path: "events/roof-inspection.md" };
    render(<SubjectCard card={cardWith({ next })} />);
    expect(screen.getByRole("link", { name: "Roof inspection" }).parentElement?.textContent).toBe(
      `Roof inspection · ${longDate("2026-11-10")}`,
    );
    expect(screen.queryByText("Order cedar boards")).toBeNull();
  });
});
