import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import styles from "@/components/add-panel/add-panel.module.css";
import { unlockTestVault } from "../../helpers.ts";

const go = vi.fn();
const saveFlow = vi.fn(async () => true);
vi.mock("@/lib/platform/router.ts", () => ({ go: (p: string) => go(p) }));
vi.mock("@/flows/save-flow.ts", () => ({ saveFlow: () => saveFlow() }));
vi.mock("@/lib/sync/writes.ts", () => ({
  queueInbox: vi.fn(async () => ({
    id: "c0ffee04",
    kind: "inbox",
    payload: {},
    created_at: "2026-11-19T10:00:00",
  })),
}));

const pickNote = vi.hoisted(() => vi.fn());
vi.mock("@/components/picker-sheet/picker-sheet.tsx", async (original) => ({
  ...(await original<object>()),
  pickNote,
}));

const alex = {
  path: "people/alex-sample.md",
  type: "Person",
  title: "Alex Sample",
  description: "",
  tags: [],
  status: "",
  modified: "2026-11-19",
  meta: {},
  body: "",
  hash: "a1",
};

const { AddPanel } = await import("@/components/add-panel/add-panel.tsx");

beforeAll(unlockTestVault);
afterEach(cleanup);

describe("AddPanel", () => {
  it("opens four choices and closes again", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "To-do",
      "Journal",
      "Note",
      "Other",
    ]);
    await user.click(screen.getByRole("button", { name: "Close", expanded: true }));
    const blob = document.querySelector(`.${styles.addSurface}`)!;
    fireEvent.animationEnd(blob, { animationName: styles["add-deflate"] });
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("goes to the full add page for other", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Other" }));
    expect(go).toHaveBeenCalledWith("/add");
  });

  it("a note asks which subject it is for before it opens the box", async () => {
    pickNote.mockResolvedValueOnce(alex);
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Note" }));
    await screen.findByRole("textbox", { name: "Note" });
    expect(pickNote).toHaveBeenCalledWith("Add a note to which subject?", expect.any(Function));
  });

  it("the note box names the subject it is for", async () => {
    pickNote.mockResolvedValueOnce(alex);
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Note" }));
    const box = await screen.findByRole("textbox", { name: "Note" });
    expect(box).toHaveAttribute("data-placeholder", "Write a note for Alex Sample");
  });

  it("a note with no subject picked never opens the box", async () => {
    pickNote.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Note" }));
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
  });

  it("turns the button into save while writing a to-do", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "To-do" }));
    expect(screen.getByRole("textbox", { name: "To-do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it.each(["To-do", "Journal"])(
    "tells the tab bar it is writing a %s, so the keyboard does not hide it",
    async (kind) => {
      const user = userEvent.setup();
      const { container } = render(<AddPanel />);
      await user.click(screen.getByRole("button", { name: "Add" }));
      await user.click(screen.getByRole("menuitem", { name: kind }));
      expect(container.firstElementChild).toHaveAttribute(
        "data-mode",
        kind === "To-do" ? "todo" : "journal",
      );
    },
  );
});
