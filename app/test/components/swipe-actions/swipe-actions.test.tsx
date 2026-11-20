import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwipeActions } from "@/components/swipe-actions/swipe-actions.tsx";

function setup() {
  const onTap = vi.fn();
  const right = vi.fn(() => Promise.resolve());
  const left = vi.fn(() => Promise.resolve());
  render(
    <SwipeActions
      right={{ label: "Sort", onSwipe: right }}
      left={{ label: "Delete", onSwipe: left }}
      onTap={onTap}
    >
      <button type="button">Call the dentist</button>
    </SwipeActions>,
  );
  return { onTap, right, left, item: screen.getByRole("button", { name: "Call the dentist" }) };
}

function swipe(el: HTMLElement, dx: number) {
  fireEvent.pointerDown(el, { clientX: 200, clientY: 10, pointerType: "touch" });
  fireEvent.pointerMove(el, { clientX: 200 + dx / 2, clientY: 10, pointerType: "touch" });
  fireEvent.pointerMove(el, { clientX: 200 + dx, clientY: 10, pointerType: "touch" });
  fireEvent.pointerUp(el, { clientX: 200 + dx, clientY: 10, pointerType: "touch" });
}

afterEach(cleanup);

describe("Swipe", () => {
  it("taps on click", async () => {
    const user = userEvent.setup();
    const { onTap, item } = setup();
    await user.click(item);
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("treats a long press like a tap", () => {
    const { onTap, item } = setup();
    fireEvent.contextMenu(item);
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["right", 120],
    ["left", -120],
  ] as const)("runs the %s action on a long swipe", (side, dx) => {
    const ctx = setup();
    swipe(ctx.item, dx);
    fireEvent.click(ctx.item);
    expect([
      ctx.right.mock.calls.length,
      ctx.left.mock.calls.length,
      ctx.onTap.mock.calls.length,
    ]).toEqual(side === "right" ? [1, 0, 0] : [0, 1, 0]);
  });

  it("does nothing on a short swipe", () => {
    const { right, left, item } = setup();
    swipe(item, 40);
    expect(right).not.toHaveBeenCalled();
    expect(left).not.toHaveBeenCalled();
  });
});
