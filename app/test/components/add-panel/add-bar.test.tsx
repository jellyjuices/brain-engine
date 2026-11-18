import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { selectEditable } from "@/lib/platform/editable.ts";
import { clearStore, putNotes } from "@/lib/storage/store.ts";
import { fixture, note, unlockTestVault } from "../../helpers.ts";

const queueInbox = vi.fn();
vi.mock("@/lib/platform/router.ts", () => ({ go: vi.fn() }));
vi.mock("@/flows/save-flow.ts", () => ({
  saveFlow: async (write: () => unknown) => {
    write();
    return true;
  },
}));
vi.mock("@/lib/sync/writes.ts", () => ({
  queueInbox: (...args: unknown[]) => queueInbox(...args),
}));

const { AddPanel } = await import("@/components/add-panel/add-panel.tsx");

beforeAll(unlockTestVault);
afterEach(cleanup);
beforeEach(async () => {
  queueInbox.mockClear();
  await clearStore();
  await putNotes([...fixture(), note("areas/money.md", "", { title: "Money", tags: ["money"] })]);
});

async function openTodo(text: string) {
  const user = userEvent.setup();
  render(<AddPanel />);
  await user.click(screen.getByRole("button", { name: "Add" }));
  await user.click(screen.getByRole("menuitem", { name: "To-do" }));
  const box = screen.getByRole("textbox", { name: "To-do" });
  box.focus();
  box.textContent = text;
  selectEditable(box, text.length, text.length);
  fireEvent.input(box);
  return { user, box };
}

describe("quick add tool bar", () => {
  it.each([
    ["Bold", "Call **mom** now"],
    ["Italic", "Call _mom_ now"],
  ])("%s wraps the selection in marks", async (label, expected) => {
    const { user, box } = await openTodo("Call mom now");
    selectEditable(box, 5, 8);
    await user.click(screen.getByRole("button", { name: label }));
    expect(box).toHaveTextContent(expected);
  });

  it("keeps the panel open after a tool tap", async () => {
    const { user } = await openTodo("Call mom");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByRole("textbox", { name: "To-do" })).toBeInTheDocument();
  });

  it("keeps the focus in the box after a tool tap", async () => {
    const { user, box } = await openTodo("Call mom");
    await user.click(screen.getByRole("button", { name: "Tag" }));
    expect(document.activeElement).toBe(box);
  });

  it("Mention opens note suggestions and a pick writes the name", async () => {
    const { user, box } = await openTodo("Call");
    await user.click(screen.getByRole("button", { name: "Mention" }));
    await user.click(await screen.findByRole("button", { name: /Aisha/ }));
    expect(box).toHaveTextContent("Call Aisha");
  });

  it("Tag opens tag suggestions and a pick saves the tag with the to-do", async () => {
    const { user } = await openTodo("Pay rent");
    await user.click(screen.getByRole("button", { name: "Tag" }));
    await user.click(await screen.findByRole("button", { name: /^#money/ }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(queueInbox).toHaveBeenCalledWith("Pay rent", undefined, ["money"]);
  });

  it("Escape closes the suggestions and keeps the box open", async () => {
    const { user } = await openTodo("Call @Ai");
    await screen.findByRole("button", { name: /Aisha/ });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: /Aisha/ })).toBeNull();
    expect(screen.getByRole("textbox", { name: "To-do" })).toBeInTheDocument();
  });

  it("typing @ opens note suggestions", async () => {
    await openTodo("Call @Ai");
    expect(await screen.findByRole("button", { name: /Aisha/ })).toBeInTheDocument();
  });
});
