import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InlineText } from "@/components/markdown/inline-text.tsx";
import { Markdown, type MarkdownProps } from "@/components/markdown/markdown.tsx";
import { inline, parseBlocks } from "@/lib/notes/markdown.ts";

afterEach(cleanup);

function renderMarkdown(src: string, o: Omit<MarkdownProps, "src">): HTMLElement {
  return render(<Markdown src={src} {...o} />).container.firstElementChild as HTMLElement;
}

function html(src: string, path = "areas/fitness.md") {
  return renderMarkdown(src, { path }).innerHTML;
}

describe("markdown renderer", () => {
  it("never lets note text become HTML", () => {
    const out = renderMarkdown(
      "# <img src=x onerror=alert(1)>\n\n<script>alert(1)</script> **<b>bold</b>** `<i>`\n\n- <svg onload=x>",
      { path: "a/b.md" },
    );
    expect(out.querySelector("script,img,svg,b,i")).toBeNull();
    expect(out.textContent).toContain("<script>alert(1)</script>");
    expect(out.textContent).toContain("<svg onload=x>");
    expect(out.innerHTML).toContain("&lt;script&gt;");
  });

  it("renders headings, emphasis, code and lists", () => {
    const out = renderMarkdown(
      "# Title\n\nSome **bold**, *soft* and `code`.\n\n- one\n- two\n  - nested\n\n1. first\n2. second",
      { path: "a/b.md" },
    );
    const view = within(out);
    expect(view.getByRole("heading", { level: 2, name: "Title" })).toBeInTheDocument();
    expect(view.getByText("bold").tagName).toBe("STRONG");
    expect(view.getByText("soft").tagName).toBe("EM");
    expect(view.getByText("code").tagName).toBe("CODE");
    const [bullets, nested, numbered] = view.getAllByRole("list");
    expect(within(bullets!).getAllByRole("listitem")).toHaveLength(3);
    expect(within(nested!).getByRole("listitem").textContent).toBe("nested");
    expect(within(numbered!).getAllByRole("listitem")).toHaveLength(2);
  });

  it("turns links between notes into in-app links, resolved from the note's folder", () => {
    const out = within(
      renderMarkdown("See [Alex](../people/alex.md) and [Sam](sam.md#top).", {
        path: "areas/fitness.md",
      }),
    );
    expect(out.getByRole("link", { name: /Alex/ })).toHaveAttribute(
      "href",
      "/note/people/alex.md",
    );
    expect(out.getByRole("link", { name: "Sam" })).toHaveAttribute("href", "/note/areas/sam.md");
    expect(out.getByRole("link", { name: /Alex/ })).not.toHaveAttribute("target");
  });

  it("opens web links outside, safely, and drops script links to plain text", () => {
    const out = renderMarkdown(
      "[site](https://example.com) [bad](javascript:alert(1)) [file](notes.txt) [mail](mailto:a@b.ca)",
      { path: "a/b.md" },
    );
    const view = within(out);
    const site = view.getByRole("link", { name: "site" });
    expect(site).toHaveAttribute("rel", "noopener noreferrer");
    expect(site).toHaveAttribute("target", "_blank");
    expect(out.innerHTML).not.toContain("javascript:");
    expect(view.getByText("bad").tagName).toBe("SPAN");
    expect(view.getByText("file").tagName).toBe("SPAN");
    expect(view.getByRole("link", { name: "mail" })).toHaveAttribute("href", "mailto:a@b.ca");
    expect(view.getAllByRole("link")).toHaveLength(2);
  });

  it("reads checkboxes with their section, and lets the caller draw to-do rows", () => {
    const blocks = parseBlocks(
      "# To-dos\n\n- [ ] Chase the MRI · due 2026-11-20\n- [x] Book a dentist\n\n# Notes\n\n- [ ] stray",
    );
    const items = blocks.flatMap((b) => (b.t === "list" ? b.items : []));
    expect(items.map((i) => [i.checked, i.section])).toEqual([
      [false, "To-dos"],
      [true, "To-dos"],
      [false, "Notes"],
    ]);
    const out = renderMarkdown("# To-dos\n\n- [ ] Chase the MRI\n- [x] Book a dentist", {
      path: "a/b.md",
      renderTodo: (i) => (i.checked ? null : <button className="row-test">{i.text}</button>),
    });
    const view = within(out);
    expect(view.getAllByRole("button", { name: "Chase the MRI" })).toHaveLength(1);
    expect(view.getByRole("checkbox", { checked: true }).textContent).toBe("Book a dentist");
  });

  it("renders quotes, rules and fenced code as text", () => {
    expect(html("> a quote\n\n---\n\n```\n<b>x</b>\n```")).toContain(
      "<blockquote>a quote</blockquote><hr><pre><code>&lt;b&gt;x&lt;/b&gt;</code></pre>",
    );
  });

  it("handles nested inline marks without leaking markers", () => {
    const tokens = inline("**bold with `code`** and _it_", "a/b.md");
    const { container } = render(<InlineText tokens={tokens} />);
    expect(container.innerHTML).toBe(
      "<strong>bold with <code>code</code></strong> and <em>it</em>",
    );
  });
});
