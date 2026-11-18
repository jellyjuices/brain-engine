import styles from "./markdown.module.css";
import type { ReactNode } from "react";
import { MarkdownBlock } from "./markdown-block.tsx";
import { parseBlocks, type ListItem } from "@/lib/notes/markdown.ts";

export interface MarkdownProps {
  src: string;
  path: string;
  renderTodo?: (item: ListItem) => ReactNode | null;
}

export function Markdown({ src, path, renderTodo }: MarkdownProps) {
  const blocks = parseBlocks(src);
  return (
    <div className={styles.md}>
      {blocks.map((b, i) => (
        <MarkdownBlock key={i} block={b} path={path} renderTodo={renderTodo} />
      ))}
    </div>
  );
}
