import { mdNoteLink } from "./markdown.styles.ts";
import { Mention } from "@/components/mention/mention.tsx";
import type { InlineToken } from "@/lib/notes/markdown.ts";

export function InlineText({ tokens }: { tokens: InlineToken[] }) {
  return tokens.map((tok, i) => {
    if (tok.t === "text") return tok.text;
    if (tok.t === "code") return <code key={i}>{tok.text}</code>;
    const children = <InlineText tokens={tok.children} />;
    if (tok.t !== "link") {
      const Tag = tok.t;
      return <Tag key={i}>{children}</Tag>;
    }
    if (!tok.href) return <span key={i}>{children}</span>;
    if (tok.person) return <Mention key={i} name={children} href={tok.href} />;
    return (
      <a
        key={i}
        href={tok.href}
        className={tok.note ? mdNoteLink : undefined}
        target={tok.external ? "_blank" : undefined}
        rel={tok.external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  });
}
