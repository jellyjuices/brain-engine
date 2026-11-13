import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InlineText } from "@/components/markdown/inline-text.tsx";
import { inline } from "@/lib/notes/markdown.ts";

afterEach(cleanup);

describe("person mention", () => {
  it("draws a link to a person note as a green @Name", () => {
    const tokens = inline(
      "Call [Aisha](../people/aisha.md) about [Gym](fitness.md)",
      "areas/fitness.md",
    );
    const { container } = render(<InlineText tokens={tokens} />);
    const mention = container.querySelector(".mention");
    expect(mention?.textContent).toBe("@Aisha");
    expect(mention?.getAttribute("href")).toBe("/note/people/aisha.md");
    expect(container.querySelectorAll(".mention")).toHaveLength(1);
  });
});
