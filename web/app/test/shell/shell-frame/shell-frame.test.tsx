import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { copy } from "@/content/index.ts";
import { renderShell, resetShell, stubUnsorted } from "../shell-setup.tsx";

const PLACES = [
  { label: copy.nav.todos, path: "/today" },
  { label: copy.nav.goals, path: "/report" },
  { label: copy.nav.find, path: "/find" },
  { label: copy.nav.brain, path: "/brain" },
];

function mainNav() {
  return screen.getByRole("navigation", { name: copy.nav.main });
}

beforeEach(() => stubUnsorted(0));

afterEach(() => {
  cleanup();
  resetShell();
});

describe("ShellFrame", () => {
  it.each(PLACES)("the tab bar goes to $label at $path", async ({ label, path }) => {
    const user = userEvent.setup();
    renderShell("phone", "/settings");
    await user.click(within(mainNav()).getByRole("link", { name: label }));
    expect(location.pathname).toBe(path);
  });

  it.each(PLACES)("the rail goes to $label at $path", async ({ label, path }) => {
    const user = userEvent.setup();
    renderShell("wide", "/settings");
    await user.click(within(mainNav()).getByRole("link", { name: label }));
    expect(location.pathname).toBe(path);
  });

  it.each(PLACES)("marks $label as the current place after a tap", async ({ label }) => {
    const user = userEvent.setup();
    renderShell("phone", "/settings");
    await user.click(within(mainNav()).getByRole("link", { name: label }));
    expect(within(mainNav()).getByRole("link", { current: "page" })).toHaveAccessibleName(label);
  });

  it("marks Brain as the current place on a note", () => {
    renderShell("wide", "/note/people/sample-person.md");
    expect(within(mainNav()).getByRole("link", { current: "page" })).toHaveAccessibleName(
      copy.nav.brain,
    );
  });

  it("marks no place on an old screen that has none", () => {
    renderShell("phone", "/write");
    expect(within(mainNav()).queryByRole("link", { current: "page" })).toBeNull();
  });

  it("the wide layout shows one rail with Settings and no tab bar", () => {
    renderShell("wide");
    expect(
      screen.getAllByRole("navigation").map((nav) => within(nav).getAllByRole("link").length),
    ).toEqual([5]);
  });

  it("the phone layout keeps Settings out of the tab bar", () => {
    renderShell("phone");
    expect(within(mainNav()).queryByRole("link", { name: copy.nav.settings })).toBeNull();
  });

  it("the phone layout reaches Settings from To-dos", async () => {
    const user = userEvent.setup();
    renderShell("phone");
    await user.click(screen.getByRole("link", { name: copy.nav.settings }));
    expect(location.pathname).toBe("/settings");
  });

  it("the popover layout draws the compact shell with every place", () => {
    const { container } = renderShell("popover");
    expect(container.firstElementChild).toHaveClass("shell--popover");
    expect(
      within(mainNav())
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(PLACES.map((place) => place.label));
  });

  it("the first Tab lands on the skip link", async () => {
    const user = userEvent.setup();
    renderShell("phone");
    await user.tab();
    expect(document.activeElement).toHaveTextContent(copy.nav.skipTo(copy.nav.todos));
  });

  it("the skip link moves focus to the main area", async () => {
    const user = userEvent.setup();
    renderShell("phone");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(document.activeElement).toContainElement(screen.getByText("Screen for 2026-11-05"));
  });

  it("on wide screens Tab goes from the skip link to Add in the rail", async () => {
    const user = userEvent.setup();
    renderShell("wide");
    await user.tab();
    await user.tab();
    expect(document.activeElement).toHaveAccessibleName(copy.nav.add);
  });
});
