import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Combobox, type Suggestion } from "@/components/combobox/combobox.tsx";

afterEach(cleanup);

const subjects: Suggestion[] = [
  { id: "louis", label: "Louis Moreau", hint: "Person" },
  { id: "health", label: "Health" },
  { id: "garden", label: "Garden" },
];

function field(onPick = vi.fn()) {
  render(<Combobox label="Find a subject" suggestions={subjects} onPick={onPick} />);
  return { onPick, input: screen.getByRole("combobox", { name: "Find a subject" }) };
}

describe("SuggestInput", () => {
  it("shows only the subjects that match the typed words", async () => {
    const user = userEvent.setup();
    const { input } = field();

    await user.type(input, "gar");

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Garden"]);
  });

  it("picks the highlighted subject with the arrow keys and Enter", async () => {
    const user = userEvent.setup();
    const { input, onPick } = field();

    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect([onPick.mock.calls[0]?.[0]?.label, (input as HTMLInputElement).value]).toEqual([
      "Health",
      "Health",
    ]);
  });

  it("wraps to the last subject with the up arrow", async () => {
    const user = userEvent.setup();
    const { input, onPick } = field();

    await user.click(input);
    await user.keyboard("{ArrowUp}{Enter}");

    expect(onPick.mock.calls[0]?.[0]?.label).toBe("Garden");
  });

  it("hides the list on Escape", async () => {
    const user = userEvent.setup();
    const { input } = field();
    await user.click(input);

    await user.keyboard("{Escape}");

    expect(input.getAttribute("aria-expanded")).toBe("false");
  });

  it("picks a subject when it is clicked", async () => {
    const user = userEvent.setup();
    const { input, onPick } = field();
    await user.click(input);

    await user.click(screen.getByRole("option", { name: /Louis Moreau/ }));

    expect(onPick.mock.calls[0]?.[0]?.id).toBe("louis");
  });
});
