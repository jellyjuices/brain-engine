import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLongPress } from "@/hooks/use-long-press.ts";

function Target({ onLongPress }: { onLongPress: () => void }) {
  const hold = useLongPress(onLongPress);
  return <button {...hold.handlers}>Hold</button>;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useLongPress", () => {
  it("fires once when a touch hold is followed by the browser context menu", () => {
    const onLongPress = vi.fn();
    render(<Target onLongPress={onLongPress} />);
    const target = screen.getByRole("button", { name: "Hold" });
    fireEvent.pointerDown(target, { button: 0 });
    act(() => void vi.advanceTimersByTime(500));
    fireEvent.contextMenu(target);
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it("fires on a right click", () => {
    const onLongPress = vi.fn();
    render(<Target onLongPress={onLongPress} />);
    fireEvent.contextMenu(screen.getByRole("button", { name: "Hold" }));
    expect(onLongPress).toHaveBeenCalledOnce();
  });

  it("does not fire when the pointer lifts early", () => {
    const onLongPress = vi.fn();
    render(<Target onLongPress={onLongPress} />);
    const target = screen.getByRole("button", { name: "Hold" });
    fireEvent.pointerDown(target, { button: 0 });
    fireEvent.pointerUp(target);
    act(() => void vi.advanceTimersByTime(600));
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
