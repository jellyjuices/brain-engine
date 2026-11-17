import { InlineText } from "./inline-text.tsx";
import type { ListNode } from "./list-tree.ts";
import { inline } from "@/lib/notes/markdown.ts";

export function ListNodes({
  nodes,
  ordered,
  from,
}: {
  nodes: ListNode[];
  ordered: boolean;
  from: string;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {nodes.map((n, i) => (
        <li key={i}>
          <InlineText tokens={inline(n.item.text, from)} />
          {n.children.length > 0 && (
            <ListNodes nodes={n.children} ordered={n.children[0]!.item.ordered} from={from} />
          )}
        </li>
      ))}
    </Tag>
  );
}
