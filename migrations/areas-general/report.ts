import type { Change, ChangeKind, OwnerLists } from "./note.ts";

const KIND_NAMES: Record<ChangeKind, string> = {
  area: "area becomes areas",
  general: "General made",
  capture: "captures moved to General",
  heading: "# Open loops renamed",
  token: "old marks changed",
  outcome: "capture outcomes renamed",
};

const ORDER: ChangeKind[] = ["area", "general", "capture", "heading", "token", "outcome"];

const LIST_NAMES: Record<keyof OwnerLists, string> = {
  needsAreas: "Goals and decisions with no areas",
  undated: "To-dos that lost `· today` and have no date",
  outside: "Old marks on to-do lines outside a to-do section (left as is)",
  bothHeadings: "Notes with both # Open loops and # To-dos (left as is)",
  badFrontmatter: "Notes with bad frontmatter (skipped)",
};

export function report(changes: Change[], lists: OwnerLists, run: { write: boolean; wrote: boolean; dirty?: string }): string[] {
  const out: string[] = [];
  const sorted = [...changes].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  for (const c of sorted) out.push(`${c.path}: ${c.what}`);
  out.push("", "Counts:");
  for (const kind of ORDER) out.push(`  ${KIND_NAMES[kind]}: ${changes.filter((c) => c.kind === kind).length}`);
  out.push("", "Needs the owner:");
  for (const key of Object.keys(LIST_NAMES) as (keyof OwnerLists)[]) {
    out.push(`  ${LIST_NAMES[key]}: ${lists[key].length}`);
    for (const item of lists[key]) out.push(`    ${item}`);
  }
  out.push("");
  if (run.wrote) out.push(`Wrote ${changes.length} changes.`);
  else if (run.write) out.push(`Did not write: ${run.dirty}. Commit first, then run again.`);
  else out.push(`Dry run: nothing written.${run.dirty ? ` Note: ${run.dirty}, so --write will refuse.` : ""} Add --write to apply.`);
  return out;
}
