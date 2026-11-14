// The short review: `brain review`. Steps with items only, then "Anything new?" for each area.
//
// The logic takes plain arguments (reviewSteps, addNow, reviewMarkdown) so tests run without a terminal.
// Only runReview needs one. There is no 1 to 10 rating.
//
// DECISION: events are not listed under overdue. An event shows in Today on its date, and a missed
// one is cancelled or moved by hand. The review lists to-dos only, so move/done/drop all work by ref.

import { join } from "node:path";
import { DIRS, folderOf, type Note, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeAtomic, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { allLoops } from "./todos.ts";
import { appendToSection } from "../../shared/line/index.ts";
import { move } from "./verbs.ts";
import { ref } from "./day-list.ts";
import { change } from "./undo.ts";
import { parseWhen } from "./when-words.ts";
import { weeklyReport } from "../reports/reports.ts";

export const NOW_HEADING = "# Now";

export interface ReviewItem {
  text: string;
  path: string;
  subject: string;
  due?: string;
  /** A stable ref for done / move / drop. Set for to-dos. */
  ref?: string;
}

export type StepKey = "inbox" | "overdue" | "stale" | "waiting" | "someday";

export interface ReviewStep {
  key: StepKey;
  title: string;
  items: ReviewItem[];
}

/** The review steps in order. A step with no items is left out. */
export function reviewSteps(root: string, now = today()): ReviewStep[] {
  const notes = loadAll(root);
  const open = allLoops(notes, { done: false });
  const todo = (l: (typeof open)[number]): ReviewItem => ({ text: l.text, path: l.path, subject: l.noteTitle, ...(l.due && { due: l.due }), ref: ref(l.path, l.text) });
  const byDue = (a: ReviewItem, b: ReviewItem) => (a.due ?? "").localeCompare(b.due ?? "") || a.subject.localeCompare(b.subject);
  const inbox = notes.filter((n) => typeOf(n) === "Capture" && folderOf(n) === "inbox");
  const stale = weeklyReport(root, notes).stale;
  const steps: ReviewStep[] = [
    { key: "inbox", title: "Inbox", items: inbox.map((n) => ({ text: titleOf(n), path: n.path, subject: "Inbox" })) },
    { key: "overdue", title: "Overdue", items: open.filter((l) => l.due && l.due < now).map(todo).sort(byDue) },
    { key: "stale", title: "Notes to check again", items: stale.map((s) => ({ text: s.title, path: s.path, subject: s.title })) },
    { key: "waiting", title: "Waiting on someone", items: open.filter((l) => l.outcome === "waiting").map(todo).sort(byDue) },
    { key: "someday", title: "Someday", items: open.filter((l) => l.outcome === "someday" && !l.due).map(todo).sort(byDue) },
  ];
  return steps.filter((s) => s.items.length);
}

/** Area notes, by slug, for the "Anything new?" round. */
export function reviewAreas(root: string): { slug: string; title: string; path: string }[] {
  return loadAll(root)
    .filter((n: Note) => typeOf(n) === "Area" && folderOf(n) === "areas")
    .map((n) => ({ slug: n.path.replace(/^areas\/|\.md$/g, ""), title: titleOf(n), path: n.path }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Write a dated line under `# Now` in an area note. Makes the heading if it is missing. One undo reverses it. */
export function addNow(root: string, area: string, text: string, date = today()): string {
  const oneLine = text.replace(/\s*\n\s*/g, " ").trim();
  if (!oneLine) throw new Error("Say what is new.");
  const path = area.endsWith(".md") ? area : `areas/${area}.md`;
  const line = `- ${date} · ${oneLine}`;
  change(root, path, `now: ${oneLine} (${path})`, () => {
    const note = readNote(root, path);
    writeNote(root, path, note.meta, appendToSection(note.body, NOW_HEADING, line));
  });
  return path;
}

export interface ReviewResult {
  done: string[];
  moved: string[];
  dropped: string[];
  kept: string[];
  now: string[]; // "Area: text"
  sorted: boolean;
}

export const emptyResult = (): ReviewResult => ({ done: [], moved: [], dropped: [], kept: [], now: [], sorted: false });

export function reviewMarkdown(date: string, steps: ReviewStep[], r: ReviewResult): string {
  const list = (xs: string[]) => (xs.length ? xs.map((x) => `- ${x}`).join("\n") : "Nothing.");
  const open = steps.map((s) => `- ${s.title}: ${s.items.length}`);
  return [
    `# Weekly review, ${date}\n`,
    `## Found\n\n${open.length ? open.join("\n") : "Nothing needed a look."}\n`,
    `## Done\n\n${list(r.done)}\n`,
    `## Moved\n\n${list(r.moved)}\n`,
    `## Deleted\n\n${list(r.dropped)}\n`,
    `## Kept\n\n${list(r.kept)}\n`,
    `## New in areas\n\n${list(r.now)}\n`,
  ].join("\n");
}

/** Write .reports/weekly.md and one log line. */
export function finishReview(root: string, steps: ReviewStep[], r: ReviewResult, now = today()): string {
  const path = join(root, DIRS.reports, "weekly.md");
  writeAtomic(path, reviewMarkdown(now, steps, r));
  log(root, `weekly review: ${r.done.length} done, ${r.moved.length} moved, ${r.dropped.length} dropped, ${r.now.length} new in areas`);
  return path;
}


export async function runReview(root: string): Promise<number> {
  const p = await import("@clack/prompts");
  const pc = (await import("picocolors")).default;
  const { doneInTerminal, dropInTerminal } = await import("./wrapup.ts");
  const stop = (v: unknown): boolean => p.isCancel(v);
  const result = emptyResult();
  const first = reviewSteps(root);
  p.intro(pc.bgCyan(pc.black(" weekly review ")));
  if (!first.length) p.log.success("Nothing needs a look.");

  for (const step of first) {
    if (step.key === "inbox") {
      const go = await p.confirm({ message: `${step.items.length} in the inbox. Sort them now?`, initialValue: true });
      if (stop(go)) break;
      if (go === true) {
        const { triage } = await import("../interface/menu.ts");
        await triage(root, false);
        result.sorted = true;
      }
      continue;
    }
    p.note(step.items.map((i) => `${i.text}${i.subject !== i.text ? pc.dim(` · ${i.subject}`) : ""}${i.due ? pc.dim(` · due ${i.due}`) : ""}`).join("\n"), `${step.title} (${step.items.length})`);
    if (step.key === "stale" || step.key === "waiting") continue;
    for (const item of step.items) {
      const verb = await p.select({
        message: item.text,
        options:
          step.key === "overdue"
            ? [{ value: "done", label: "Done" }, { value: "move", label: "Move" }, { value: "drop", label: "Delete" }, { value: "skip", label: "Leave it" }]
            : [{ value: "keep", label: "Keep" }, { value: "drop", label: "Delete" }],
      });
      if (stop(verb)) break;
      try {
        if (verb === "done") result.done.push((await doneInTerminal(root, item.ref!)).line.replace(/ · brain undo$/, ""));
        else if (verb === "drop") result.dropped.push((await dropInTerminal(root, item.ref!)).line.replace(/ · brain undo$/, ""));
        else if (verb === "move") {
          const when = await p.text({
            message: "When? (today, tomorrow, a weekday, YYYY-MM-DD, someday or waiting)",
            validate: (v) => {
              try {
                parseWhen(v ?? "");
              } catch (err) {
                return (err as Error).message;
              }
            },
          });
          if (stop(when)) break;
          result.moved.push(move(root, item.ref!, when as string).line.replace(/ · brain undo$/, ""));
        } else result.kept.push(item.text);
      } catch (err) {
        p.log.error((err as Error).message);
      }
    }
  }

  for (const a of reviewAreas(root)) {
    const answer = await p.text({ message: `${a.title}: Anything new? (Enter to skip)` });
    if (stop(answer)) break;
    const text = (answer as string).trim();
    if (!text) continue;
    addNow(root, a.path, text);
    result.now.push(`${a.title}: ${text}`);
  }

  const path = finishReview(root, first, result);
  p.outro(pc.dim(`Saved to ${path}`));
  return 0;
}

