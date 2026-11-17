import "fake-indexeddb/auto";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { unlockTestVault } from "../../helpers.ts";

const go = vi.fn();
const saveFlow = vi.fn(async () => true);
vi.mock("@/lib/platform/router.ts", () => ({ go: (p: string) => go(p) }));
vi.mock("@/flows/save-flow.ts", () => ({ saveFlow: () => saveFlow() }));
vi.mock("@/lib/sync/writes.ts", () => ({ queueInbox: vi.fn() }));

const { AddPanel } = await import("@/components/add-panel/add-panel.tsx");

beforeAll(unlockTestVault);
afterEach(cleanup);

describe("AddPanel", () => {
  it("opens three choices and closes again", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Close", expanded: true }));
    const blob = document.querySelector(".add-blob");
    if (blob) fireEvent.animationEnd(blob, { animationName: "add-deflate" });
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("goes to the full add page for other", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "Other" }));
    expect(go).toHaveBeenCalledWith("/new");
  });

  it("turns the button into save while writing a to-do", async () => {
    const user = userEvent.setup();
    render(<AddPanel />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("menuitem", { name: "To-do" }));
    expect(screen.getByRole("textbox", { name: "To-do" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
