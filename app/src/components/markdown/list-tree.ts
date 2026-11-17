import type { ListItem } from "@/lib/notes/markdown.ts";

export interface ListNode {
  item: ListItem;
  children: ListNode[];
}

export type ListRun =
  { kind: "check"; item: ListItem } | { kind: "list"; ordered: boolean; nodes: ListNode[] };

export function listRuns(items: ListItem[]): ListRun[] {
  const runs: ListRun[] = [];
  let stack: ListNode[] = [];
  for (const item of items) {
    if (item.checked !== undefined) {
      runs.push({ kind: "check", item });
      stack = [];
      continue;
    }
    const last = runs[runs.length - 1];
    const node: ListNode = { item, children: [] };
    if (!stack.length || last?.kind !== "list") {
      runs.push({ kind: "list", ordered: item.ordered, nodes: [node] });
      stack = [node];
      continue;
    }
    while (stack.length > 1 && stack[stack.length - 1]!.item.level >= item.level) stack.pop();
    const parent = stack[stack.length - 1]!;
    if (item.level > parent.item.level) parent.children.push(node);
    else last.nodes.push(node);
    stack.push(node);
  }
  return runs;
}

export type CheckGroup =
  { kind: "checks"; items: ListItem[] } | { kind: "list"; ordered: boolean; nodes: ListNode[] };

export function checkGroups(items: ListItem[]): CheckGroup[] {
  const groups: CheckGroup[] = [];
  for (const run of listRuns(items)) {
    const last = groups[groups.length - 1];
    if (run.kind === "list") groups.push(run);
    else if (last?.kind === "checks") last.items.push(run.item);
    else groups.push({ kind: "checks", items: [run.item] });
  }
  return groups;
}
