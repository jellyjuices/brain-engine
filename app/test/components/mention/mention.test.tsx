import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InlineText } from "@/components/markdown/inline-text.tsx";
import { inline } from "@/lib/notes/markdown.ts";

afterEach(cleanup);

describe("person mention", () => {
  it("draws a link to a person note as a green @Name", () => {
    const tokens = inline(
      "Call [Alex](../people/alex.md) about [Sample place](fitness.md)",
      "areas/fitness.md",
    );
    render(<InlineText tokens={tokens} />);
    const mention = screen.getByRole("link", { name: "@Alex" });
    expect(mention).toHaveAttribute("href", "/note/people/alex.md");
    expect(screen.getAllByRole("link", { name: /^@/ })).toHaveLength(1);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
