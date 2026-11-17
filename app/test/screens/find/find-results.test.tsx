import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FindResults } from "@/screens/find/find-results.tsx";
import { note } from "../../helpers.ts";

const notes = [
  note("projects/garden-shed.md", "# Plan\n\n- [ ] Buy cedar boards at the yard", {
    title: "Garden shed",
    type: "Project",
  }),
  note("places/corner-cafe.md", "# Notes\n\nGood espresso by the window.", {
    title: "Corner cafe",
  }),
];

afterEach(cleanup);

describe("find results", () => {
  it("shows the top line as the answer, linked to its note", async () => {
    render(<FindResults q="cedar" notes={notes} remote={null} />);
    const [answer] = await screen.findAllByRole("link");
    expect(answer).toHaveTextContent("Buy cedar boards at the yardGarden shed");
    expect(answer).toHaveAttribute("href", expect.stringContaining("garden-shed"));
  });

  it("shows a person's card before the answer line", async () => {
    const people = [
      note("people/aisha.md", "# Notes\n\nMet at the market.", { title: "Aisha", type: "Person" }),
      note("areas/home.md", "# Notes\n\nAisha called about the fence quote.", { title: "Home" }),
    ];
    render(<FindResults q="aisha" notes={people} remote={null} />);
    const links = await screen.findAllByRole("link");
    expect(links.map((link) => link.textContent).slice(0, 2)).toEqual([
      "AishaPerson",
      "Notes Aisha called about the fence quote.Home",
    ]);
  });

  it("finds a typo on the device", async () => {
    render(<FindResults q="espreso" notes={notes} remote={null} />);
    const links = await screen.findAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toContain("/note/places/corner-cafe.md");
  });
});
