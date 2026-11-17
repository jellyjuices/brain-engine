import { Fragment } from "react";
import { List } from "@/components/row/list.tsx";
import styles from "./markdown.module.css";
import { InlineText } from "./inline-text.tsx";
import { ListNodes } from "./list-nodes.tsx";
import { checkGroups } from "./list-tree.ts";
import type { MarkdownProps } from "./markdown.tsx";
import { PlainCheck } from "./plain-check.tsx";
import { inline, type Block } from "@/lib/notes/markdown.ts";

export function MarkdownBlock({
  block,
  path,
  renderTodo,
}: {
  block: Block;
  path: string;
  renderTodo?: MarkdownProps["renderTodo"];
}) {
  if (block.t === "heading") {
    const Tag = `h${Math.min(block.level + 1, 5)}` as "h2";
    return (
      <Tag className={styles.mdH}>
        <InlineText tokens={inline(block.text, path)} />
      </Tag>
    );
  }
  if (block.t === "para")
    return (
      <p>
        <InlineText tokens={inline(block.text, path)} />
      </p>
    );
  if (block.t === "quote")
    return (
      <blockquote>
        <InlineText tokens={inline(block.text, path)} />
      </blockquote>
    );
  if (block.t === "code")
    return (
      <pre>
        <code>{block.text}</code>
      </pre>
    );
  if (block.t === "hr") return <hr />;
  return (
    <div className={styles.mdList}>
      {checkGroups(block.items).map((group, i) =>
        group.kind === "checks" ? (
          <List key={i}>
            {group.items.map((item, j) => (
              <Fragment key={j}>
                {renderTodo?.(item) ?? (
                  <PlainCheck text={item.text} checked={!!item.checked} from={path} />
                )}
              </Fragment>
            ))}
          </List>
        ) : (
          <ListNodes key={i} nodes={group.nodes} ordered={group.ordered} from={path} />
        ),
      )}
    </div>
  );
}
