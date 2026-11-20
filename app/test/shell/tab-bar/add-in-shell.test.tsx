import "fake-indexeddb/auto";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import styles from "@/components/add-panel/add-panel.module.css";
import { unlockTestVault } from "../../helpers.ts";
import { HOLD_MS } from "@/components/add-panel/use-hold-to-pick.ts";
import { HOME } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";
import { renderShell, resetShell, stubUnsorted } from "../shell-setup.tsx";

const PRESS = { pointerId: 1, isPrimary: true, button: 0, pointerType: "touch" };

function addButton() {
  return screen.getByRole("button", { name: copy.nav.add });
}

function finishClosing() {
  const blob = document.querySelector(`.${styles.addSurface}`)!;
  fireEvent.animationEnd(blob, { animationName: styles["add-deflate"] });
}

async function holdAdd() {
  fireEvent.pointerDown(addButton(), PRESS);
  await act(() => vi.advanceTimersByTimeAsync(HOLD_MS));
}

beforeAll(unlockTestVault);
beforeEach(() => stubUnsorted(0));

afterEach(() => {
  cleanup();
  resetShell();
});

describe("Add in the shell", () => {
  it.each(["phone", "wide"] as const)(
    "a tap on Add opens the kinds in the %s layout",
    async (layout) => {
      const user = userEvent.setup();
      renderShell(layout);
      await user.click(addButton());
      expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
        copy.add.todo,
        copy.add.journal,
        copy.add.other,
      ]);
    },
  );

  it("Escape closes the Add panel", async () => {
    const user = userEvent.setup();
    renderShell("phone");
    await user.click(addButton());
    await user.keyboard("{Escape}");
    finishClosing();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("back closes the Add panel and stays on the screen", async () => {
    const user = userEvent.setup();
    renderShell("phone");
    await user.click(addButton());
    const popped = new Promise((resolve) => addEventListener("popstate", resolve, { once: true }));
    history.back();
    await act(() => popped);
    finishClosing();
    expect([screen.queryByRole("menu"), location.pathname]).toEqual([null, HOME]);
  });

  it("holding Add opens the kinds before the finger lifts", async () => {
    vi.useFakeTimers();
    renderShell("phone");
    await holdAdd();
    expect(screen.getByRole("menu", { name: copy.add.newTitle })).toBeInTheDocument();
  });

  it("a short press does not open the kinds on its own", async () => {
    vi.useFakeTimers();
    renderShell("phone");
    fireEvent.pointerDown(addButton(), PRESS);
    await act(() => vi.advanceTimersByTimeAsync(HOLD_MS - 100));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("letting go on Journal after a hold opens Journal", async () => {
    vi.useFakeTimers();
    renderShell("phone");
    await holdAdd();
    fireEvent.pointerUp(screen.getByRole("menuitem", { name: copy.add.journal }), PRESS);
    expect(screen.getByRole("textbox", { name: copy.add.journal })).toBeInTheDocument();
  });

  it("letting go outside every kind closes the kinds", async () => {
    vi.useFakeTimers();
    renderShell("wide");
    await holdAdd();
    fireEvent.pointerUp(screen.getByText("Screen for 2026-11-05"), PRESS);
    finishClosing();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("letting go on Add itself after a hold closes the kinds", async () => {
    vi.useFakeTimers();
    renderShell("phone");
    await holdAdd();
    const held = screen.getByRole("button", { name: copy.common.close, expanded: true });
    fireEvent.pointerUp(held, PRESS);
    fireEvent.click(held);
    finishClosing();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
