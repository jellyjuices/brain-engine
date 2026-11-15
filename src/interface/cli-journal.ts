// `brain sort --journal` lists journal notes that wait. `brain sort journal/<note>.md --bits '<json>'` sorts one,
// with the same code as the sort route.

import pc from "picocolors";
import { BIT_KINDS, type SortBit, whenFrom } from "../capture/file.ts";
import { sortJournal, waitingJournals } from "../capture/journal.ts";
import { loadAll } from "../core/files.ts";
import { str, titleOf } from "../core/notes.ts";
import { type CliContext, fail, out } from "./cli-shared.ts";

const strings = (x: unknown) => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : undefined);

function bitsFrom(raw: string): SortBit[] {
  const list: unknown = JSON.parse(raw);
  if (!Array.isArray(list) || !list.length) throw new Error("--bits must be a JSON list with at least one bit.");
  return list.map((b: Record<string, unknown>, i) => {
    const when = typeof b?.when === "string" ? whenFrom(b.when) : undefined;
    if (typeof b?.into !== "string" || !when) throw new Error(`Bit ${i + 1} needs "into" (a note path) and "when" (a day I know).`);
    const kind = typeof b.kind === "string" && (BIT_KINDS as readonly string[]).includes(b.kind) ? (b.kind as SortBit["kind"]) : undefined;
    return { into: b.into, when, text: typeof b.text === "string" ? b.text : undefined, kind, about: typeof b.about === "string" ? b.about : undefined, with: strings(b.with), re: strings(b.re) };
  });
}

export function journalSort(c: CliContext): number {
  const { root, args, flags, json, report } = c;
  const notes = loadAll(root);
  if (!args[0]) {
    const waiting = waitingJournals(notes).map((n) => ({ path: n.path, title: titleOf(n), date: str(n.meta.date), text: n.body.trim() }));
    if (flags.json) json(waiting);
    else if (!waiting.length) out(pc.dim("No journal notes wait."));
    else for (const w of waiting) out(`${w.date}  ${w.title}  ${pc.dim(w.path)}`);
    return 0;
  }
  if (!flags.bits) return fail(`Use: brain sort ${args[0]} --bits '[{"into":"people/x.md","when":"note","text":"…"}]'`);
  try {
    const result = sortJournal(root, notes, args[0], bitsFrom(flags.bits));
    report(result, `${pc.green("Sorted")} ${args[0]} into ${result.into.join(", ")}. The journal stays whole.`);
    return 0;
  } catch (err) {
    return fail((err as Error).message);
  }
}
