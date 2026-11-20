import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ListRow } from "@/components/list/list-row.tsx";

afterEach(cleanup);

const cases = [
  { name: "a checked row is pressed", checked: true, pressed: "true" },
  { name: "an unchecked row is not pressed", checked: false, pressed: "false" },
  { name: "a plain row has no pressed state", checked: undefined, pressed: null },
];

describe("Row checked", () => {
  it.each(cases)("$name", ({ checked, pressed }) => {
    render(
      <ListRow title="Break it up into to-dos and notes" checked={checked} onClick={() => {}} />,
    );
    const row = screen.getByRole("button", { name: "Break it up into to-dos and notes" });
    expect(row.getAttribute("aria-pressed")).toBe(pressed);
  });
});
