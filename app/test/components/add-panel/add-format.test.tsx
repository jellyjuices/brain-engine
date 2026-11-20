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

function typeInto(box: HTMLElement, text: string, caret = text.length) {
  box.textContent = text;
  selectEditable(box, caret, caret);
  fireEvent.input(box);
}

async function openTodo(text: string) {
  const user = userEvent.setup();
  render(<AddPanel />);
  await user.click(screen.getByRole("button", { name: "Add" }));
  await user.click(screen.getByRole("menuitem", { name: "To-do" }));
  const box = screen.getByRole("textbox", { name: "To-do" });
  box.focus();
  typeInto(box, text);
  return { user, box };
}

async function save(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Save" }));
  return queueInbox.mock.calls[0]?.[0];
}

describe("rich formatting in the add box", () => {
  it.each([
    ["Bold", "Call **mom** now"],
    ["Italic", "Call _mom_ now"],
  ])("%s on a selection shows no marks but saves them", async (label, saved) => {
    const { user, box } = await openTodo("Call mom now");
    selectEditable(box, 5, 8);
    await user.click(screen.getByRole("button", { name: label }));
    expect(box.textContent).toBe("Call mom now");
    expect(await save(user)).toBe(saved);
  });

  it("Bold with the caret in a word draws that word bold", async () => {
    const { user, box } = await openTodo("Call mom now");
    selectEditable(box, 6, 6);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByText("mom").className).toMatch(/liveBold/);
  });

  it("words typed after a bolded word stay bold", async () => {
    const { user, box } = await openTodo("Call mom");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    typeInto(box, "Call mom and dad");
    expect(await save(user)).toBe("Call **mom and dad**");
  });

  it("Bold on an empty spot makes the next typed words bold", async () => {
    const { user, box } = await openTodo("Call ");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    typeInto(box, "Call mom");
    expect(await save(user)).toBe("Call **mom**");
  });

  it("Bold on part of a bold word takes bold off that part only", async () => {
    const { user, box } = await openTodo("Call grandma");
    selectEditable(box, 5, 12);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    selectEditable(box, 10, 12);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(await save(user)).toBe("Call **grand**ma");
  });

  it("Bold twice on a word saves it plain", async () => {
    const { user, box } = await openTodo("Call mom");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    selectEditable(box, 6, 6);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(await save(user)).toBe("Call mom");
  });

  it("deleting a letter in a bold word keeps the rest bold", async () => {
    const { user, box } = await openTodo("Call moms");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    typeInto(box, "Call mom");
    expect(await save(user)).toBe("Call **mom**");
  });

  it("Ctrl+B bolds the word at the caret", async () => {
    const { user } = await openTodo("Call mom");
    await user.keyboard("{Control>}b{/Control}");
    expect(await save(user)).toBe("Call **mom**");
  });

  it("typing # opens tag suggestions", async () => {
    await openTodo("Pay rent #mo");
    expect(await screen.findByRole("button", { name: /^#money/ })).toBeInTheDocument();
  });

  it("typing @ then picking keeps the bold around it", async () => {
    const { user, box } = await openTodo("Call");
    await user.click(screen.getByRole("button", { name: "Bold" }));
    typeInto(box, "Call @Ai");
    await user.click(await screen.findByRole("button", { name: /Aisha/ }));
    expect(screen.getByText("@Aisha").className).toMatch(/liveBold.*liveMention/);
  });
});
