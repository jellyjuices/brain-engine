import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { go } from "@/lib/platform/router.ts";
import { AddScreen } from "@/screens/add/add.tsx";
import { copy } from "@/content/index.ts";

beforeEach(() => go("/add"));

afterEach(cleanup);

describe("Add > Other", () => {
  it("the Goal row opens the goal builder", async () => {
    const user = userEvent.setup();
    render(<AddScreen />);
    await user.click(screen.getByRole("button", { name: new RegExp(copy.add.goal) }));
    expect(location.pathname).toBe("/build/goal");
  });
});
