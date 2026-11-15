import { md } from "./markdown.styles.ts";
import type { ReactNode } from "react";
import { MarkdownBlock } from "./markdown-block.tsx";
import { parseBlocks, pruneOpenLoops, type ListItem } from "@/lib/notes/markdown.ts";

export interface MarkdownProps {
  src: string;
  path: string;
  hideOpenLoops?: boolean;
  renderTodo?: (item: ListItem) => ReactNode | null;
}

export function Markdown({ src, path, hideOpenLoops, renderTodo }: MarkdownProps) {
  const parsed = parseBlocks(src);
  const blocks = hideOpenLoops ? pruneOpenLoops(parsed) : parsed;
  return (
    <div className={md}>
      {blocks.map((b, i) => (
        <MarkdownBlock key={i} block={b} path={path} renderTodo={renderTodo} />
      ))}
    </div>
  );
}
