import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DayPicker } from "@/components/day-picker/day-picker.tsx";

afterEach(cleanup);

describe("DayPicker", () => {
  it("turns past days off", () => {
    render(<DayPicker min="2026-11-05" today="2026-11-05" onPick={() => {}} />);
    expect(screen.getByRole("button", { name: "Wed Nov 04 2026" })).toBeDisabled();
  });

  it("turns off the way back to a month before the first day", () => {
    render(<DayPicker min="2026-11-05" today="2026-11-05" onPick={() => {}} />);
    expect(screen.getByRole("button", { name: "Last month" })).toBeDisabled();
  });

  it("hands back the day that was tapped", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<DayPicker min="2026-11-05" today="2026-11-05" onPick={onPick} />);
    await user.click(screen.getByRole("button", { name: "Fri Nov 20 2026" }));
    expect(onPick).toHaveBeenCalledWith("2026-11-20");
  });
});
