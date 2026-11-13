import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
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
    expect(out.querySelector("h2")?.textContent).toBe("Title");
    expect(out.querySelector("strong")?.textContent).toBe("bold");
    expect(out.querySelector("em")?.textContent).toBe("soft");
    expect(out.querySelector("code")?.textContent).toBe("code");
    expect(out.querySelectorAll("ul > li").length).toBe(3);
    expect(out.querySelector("ul ul li")?.textContent).toBe("nested");
    expect(out.querySelectorAll("ol > li").length).toBe(2);
  });

  it("turns links between notes into in-app links, resolved from the note's folder", () => {
    const a = renderMarkdown("See [Aisha](../people/aisha.md) and [Em](em.md#top).", {
      path: "areas/fitness.md",
    }).querySelectorAll("a");
    expect(a[0]!.getAttribute("href")).toBe("/note/people/aisha.md");
    expect(a[1]!.getAttribute("href")).toBe("/note/areas/em.md");
    expect(a[0]!.getAttribute("target")).toBeNull();
  });

  it("opens web links outside, safely, and drops script links to plain text", () => {
    const out = renderMarkdown(
      "[site](https://example.com) [bad](javascript:alert(1)) [file](notes.txt) [mail](mailto:a@b.ca)",
      { path: "a/b.md" },
    );
    const [site, bad, file, mail] = [...out.querySelectorAll("a, span")];
    expect(site!.getAttribute("rel")).toBe("noopener noreferrer");
    expect(site!.getAttribute("target")).toBe("_blank");
    expect(out.innerHTML).not.toContain("javascript:");
    expect(bad!.tagName).toBe("SPAN");
    expect(file!.tagName).toBe("SPAN");
    expect(mail!.getAttribute("href")).toBe("mailto:a@b.ca");
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
    expect(out.querySelectorAll(".row-test").length).toBe(1);
    expect(out.querySelector('[role="checkbox"][aria-checked="true"]')?.textContent).toBe(
      "Book a dentist",
    );
  });

  it("can hide open to-dos (and an emptied To-dos heading) when a card shows them", () => {
    const out = renderMarkdown("# To-dos\n\n- [ ] Open one\n\n# Notes\n\n- 2026-11-01 · kept", {
      path: "a/b.md",
      hideOpenLoops: true,
    });
    expect(out.textContent).not.toContain("Open one");
    expect(out.textContent).not.toContain("To-dos");
    expect(out.textContent).toContain("kept");
    const keepsDone = renderMarkdown("# To-dos\n\n- [ ] gone\n- [x] stays", {
      path: "a/b.md",
      hideOpenLoops: true,
    });
    expect(keepsDone.textContent).toContain("To-dos");
    expect(keepsDone.textContent).toContain("stays");
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
