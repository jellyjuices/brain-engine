// The app you get when you type `brain` in a terminal. It opens on the list; pick a to-do, then a verb.
//
// The top half is pure (counts, option lists, labels) so tests can run it on fixtures.
// The bottom half is the prompts. It calls the same functions as the commands, so there is no second copy of
// the logic: verbs.ts (done, move, drop, undo), wrapup.ts (What happened?), overdue.ts, review.ts, file.ts,
// card.ts, intake.ts and menu.ts (sort, intake).
//
// DECISION: the list is the screen. Pick a to-do, then a verb. Esc or Ctrl+C goes back one level; on the list it quits.
// DECISION: housekeeping (the search index) runs by itself after each change. There is no Tidy screen.
// DECISION: a to-do on the list is picked by its list number. The list is saved each time it is drawn, so the number is current.
// DECISION: section titles are disabled options (gray, skipped by the cursor). Clack 1.8 draws them without a strikethrough.

import * as p from "@clack/prompts";
import pc from "picocolors";
import { loadAll } from "../core/files.ts";
import { dayList } from "../todos/day-list.ts";
import { undo } from "../todos/undo.ts";
import { BACK, triage } from "./menu.ts";
import { askOverdue } from "../todos/overdue.ts";
import { headerCounts, headerLine, listOptions, undoHead, undoLabel } from "./ui-view.ts";
import { addScreen, findScreen, moreScreen, todoScreen } from "./ui-screens.ts";
import { pick, run, tidy, width } from "./ui-prompts.ts";

export async function ui(root: string): Promise<number> {
  console.clear();
  try {
    const line = await askOverdue(root);
    if (line) p.log.success(line);
  } catch (err) {
    p.log.error((err as Error).message);
  }
  const startHead = undoHead(root)?.id;
  for (;;) {
    const items = dayList(root);
    const counts = headerCounts(root, loadAll(root), items);
    const head = undoHead(root);
    const undoText = head && head.id !== startHead ? undoLabel(head.msg) : undefined;
    // Pressing u on the list undoes the last change: it stops the prompt and the loop runs the undo.
    const ac = new AbortController();
    let uKey = false;
    const onKey = (_s: unknown, k?: { name?: string; ctrl?: boolean }) => {
      if (undoText && k?.name === "u" && !k.ctrl) { uKey = true; ac.abort(); }
    };
    process.stdin.on("keypress", onKey);
    const choice = await pick(headerLine(counts), listOptions(items, counts, undoText, width()), { signal: ac.signal }).finally(() => process.stdin.off("keypress", onKey));
    if (uKey) { await run(root, () => undo(root)); continue; }
    if (choice === BACK) break;
    try {
      if (choice.startsWith("todo:")) {
        const item = items.find((x) => `todo:${x.n}` === choice)!;
        await todoScreen(root, String(item.n), item.text, item.path, item.subject);
      } else if (choice === "add") await addScreen(root);
      else if (choice === "find") await findScreen(root);
      else if (choice === "sort") { await triage(root, false); tidy(root); }
      else if (choice === "undo") await run(root, () => undo(root));
      else if (choice === "more") await moreScreen(root);
    } catch (err) {
      p.log.error((err as Error).message);
    }
  }
  p.outro(pc.dim("See you later."));
  return 0;
}
