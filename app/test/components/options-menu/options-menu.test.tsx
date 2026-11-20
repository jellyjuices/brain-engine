import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OptionsMenu, type Option } from "@/components/options-menu/options-menu.tsx";

afterEach(cleanup);

function menu(onSelect = vi.fn(), onOpenChange = vi.fn()) {
  const options: Option[] = [
    {
      id: "move",
      label: "Move to",
      options: [
        { id: "health", label: "Health", selected: true, onSelect },
        { id: "garden", label: "Garden", onSelect },
      ],
    },
    { id: "delete", label: "Delete", tone: "danger", onSelect },
  ];
  render(
    <OptionsMenu open onOpenChange={onOpenChange} title="Oil the shed hinges" options={options} />,
  );
  return { onSelect, onOpenChange };
}

describe("OptionsMenu", () => {
  it("opens a step when an option has its own options", async () => {
    const user = userEvent.setup();
    menu();

    await user.click(screen.getByRole("button", { name: "Move to" }));

    expect(screen.getByRole("button", { name: "Garden" })).toBeTruthy();
  });

  it("marks the picked option as pressed", async () => {
    const user = userEvent.setup();
    menu();

    await user.click(screen.getByRole("button", { name: "Move to" }));

    expect(screen.getByRole("button", { name: "Health" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("goes back to the first step with the back arrow", async () => {
    const user = userEvent.setup();
    menu();
    await user.click(screen.getByRole("button", { name: "Move to" }));

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("runs the option and closes when a plain option is picked", async () => {
    const user = userEvent.setup();
    const { onSelect, onOpenChange } = menu();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect([onSelect.mock.calls.length, onOpenChange.mock.calls]).toEqual([1, [[false]]]);
  });
});
