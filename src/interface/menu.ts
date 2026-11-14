// Shared terminal flows: prompts, the brain dump, the area questions and the one-step sort. The app itself is ui.ts.

import * as p from "@clack/prompts";
import pc from "picocolors";
import { AREA_QUESTIONS, applyTriage, brainDump, newNote } from "../capture/actions.ts";
import { areasOf, DIRS, folderOf, type Note, str, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, readNote } from "../core/files.ts";
import { captureText, newSubject } from "../todos/absorb.ts";
import { bestHome, sortCapture, subjectsNamed, whenFrom, type When } from "../capture/file.ts";
import { SUBJECT_TYPES } from "../reports/card.ts";
import { secondMentions } from "../reports/mentions.ts";
import type { Mention } from "../reports/mentions.ts";
import { list } from "../core/search.ts";

export const BACK = Symbol("back");
export type Back = typeof BACK;

/** Wrap a prompt: Esc or Ctrl+C returns BACK instead of a value. */
export async function ask<T>(prompt: Promise<T>): Promise<Exclude<T, symbol> | Back> {
  const answer = await prompt;
  return p.isCancel(answer) ? BACK : (answer as Exclude<T, symbol>);
}


export function areaOptions(root: string) {
  return list(root, { type: "Area" })
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((a) => ({ value: a.path.replace(/^areas\/|\.md$/g, ""), label: a.title, hint: a.description }));
}

export function render(md: string) {
  return md
    .split("\n")
    .map((l) => (l.startsWith("# ") ? pc.bold(pc.cyan(l.slice(2))) : l.startsWith("## ") ? pc.bold(l.slice(3)) : l.replace(/\[([^\]]+)\]\([^)]+\)/g, (_, t: string) => pc.underline(t))))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Intake and sort, also used by `brain intake` and `brain sort`.

export async function intakeDump(root: string, standalone = true): Promise<number> {
  if (standalone) p.intro(pc.bgCyan(pc.black(" brain dump ")));
  p.log.message("Type every to-do you can think of. One per line. No order, half sentences are fine.");
  const text = await ask(p.multiline({ message: "What's on your plate?", placeholder: "Send HST return\nFix the hero on Website 2.0\nBook a dentist", showSubmit: true }));
  if (text === BACK || !text.trim()) {
    if (standalone) p.outro("Nothing saved.");
    return 0;
  }
  const notes = brainDump(root, text);
  p.log.success(`Saved ${notes.length} note${notes.length === 1 ? "" : "s"} to inbox/.`);
  const go = await ask(p.confirm({ message: "Sort them now?" }));
  if (go === true) await triage(root, false);
  if (standalone) p.outro("Nice work. That's out of your head.");
  return 0;
}

export async function intakeArea(root: string, area?: string, standalone = true): Promise<number> {
  if (standalone) p.intro(pc.bgCyan(pc.black(" area intake ")));
  if (!area) {
    const picked = await ask(p.select({ message: "Which area feels heaviest?", options: areaOptions(root) }));
    if (picked === BACK) return 0;
    area = picked;
  }
  const answers: string[] = [];
  for (const [i, q] of AREA_QUESTIONS.entries()) {
    const answer = await ask(p.multiline({ message: `${i + 1} of ${AREA_QUESTIONS.length}. ${q}`, placeholder: "Enter twice to go on. Leave blank to skip.", showSubmit: true }));
    if (answer === BACK) {
      if (standalone) p.outro("Stopped. Nothing saved.");
      return 0;
    }
    answers.push(answer);
  }
  const note = (await import("../capture/actions.ts")).saveAreaIntake(root, area, answers);
  p.log.success(`Saved your answers in ${note.path}.`);
  const dump = await ask(p.confirm({ message: "Any to-dos from that to add to the inbox?", initialValue: false }));
  if (dump === true) {
    const text = await ask(p.multiline({ message: "One per line", showSubmit: true }));
    if (text !== BACK && text.trim()) p.log.success(`Saved ${brainDump(root, text, { area }).length} notes to inbox/.`);
  }
  if (standalone) p.outro("That area is mapped.");
  return 0;
}

const WHEN_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "date", label: "A date" },
  { value: "someday", label: "Someday" },
  { value: "waiting", label: "Waiting on someone" },
  { value: "note", label: "Not a to-do", hint: "keep it as a note" },
  { value: "drop", label: "Delete it" },
  { value: "skip", label: pc.dim("Skip for now") },
  { value: "stop", label: pc.dim("Stop") },
];

/** Ask "About what?" with the best match picked first. Returns a note path or BACK. */
async function aboutWhat(root: string, text: string, area?: string): Promise<string | Back> {
  const notes = loadAll(root);
  const best = bestHome(notes, text, area);
  const named = subjectsNamed(notes, text).map((n) => n.path);
  const subjects = notes.filter((n) => folderOf(n) !== DIRS.archive && SUBJECT_TYPES.includes(String(typeOf(n))) && !["Lens", "Note"].includes(String(typeOf(n))));
  const byPath = new Map(subjects.map((n) => [n.path, n]));
  const order = [...(best.into ? [best.into] : []), ...named, ...subjects.map((n) => n.path)];
  const seen = new Set<string>();
  const options = [
    ...order.filter((x) => byPath.has(x) && !seen.has(x) && seen.add(x)).map((x) => ({ value: x, label: titleOf(byPath.get(x)!), hint: x === best.into ? `best match: ${best.reason}` : String(typeOf(byPath.get(x)!)).toLowerCase() })),
    { value: "new-project", label: "New project…" },
    { value: "new-person", label: "New person…" },
  ];
  const into = await ask(p.select({ message: "About what?", options, maxItems: 12 }));
  if (into === BACK) return BACK;
  if (into === "new-project" || into === "new-person") {
    const type = into === "new-project" ? "Project" : "Person";
    const title = await ask(p.text({ message: `${type} name`, validate: (v) => (v?.trim() ? undefined : "A name is needed.") }));
    if (title === BACK) return BACK;
    const desc = await ask(p.text({ message: "One line on what it is", validate: (v) => (v?.trim() ? undefined : "A short line is needed.") }));
    if (desc === BACK) return BACK;
    return newSubject(root, type, title, desc, area);
  }
  return into;
}

/** Map an old sorted capture's outcome to the When it means, so it is picked first. */
function whenOfOld(n: Note): string | undefined {
  const outcome = String(n.meta.outcome ?? "");
  return { today: "today", date: "date", someday: "someday", waiting: "waiting", keep: "note", "do-now": "today", schedule: "date", park: "someday", "hand-off": "waiting" }[outcome];
}

/** "Omar came up again. Make a note?" On yes, ask the kind (Person first for one name) and one line, then make it. */
async function offerNote(root: string, m: Mention) {
  const yes = await ask(p.confirm({ message: `${m.name} came up again. Make a note?`, initialValue: true }));
  if (yes === BACK || !yes) return;
  const kinds = [["Person", "Who"], ["Group", "Who (a group)"], ["Place", "Where"], ["Thing", "Have"], ["Topic", "Know"]];
  const ordered = m.suggest ? kinds : [...kinds.slice(2), ...kinds.slice(0, 2)];
  const type = await ask(p.select({ message: "Who, where, have, or know?", options: ordered.map(([value, label]) => ({ value, label })) }));
  if (type === BACK) return;
  const description = await ask(p.text({ message: "One line on what it is", validate: (v) => (v?.trim() ? undefined : "One line is needed.") }));
  if (description === BACK) return;
  const note = newNote(root, type, m.name, { description: description.trim() });
  p.log.success(`Created ${note.path}`);
}

/**
 * Sort the inbox in one step per note: When? and About what?
 * The text goes into the subject note and the capture is archived with absorbed_into.
 */
export async function triage(root: string, standalone = true): Promise<number> {
  if (standalone) p.intro(pc.bgCyan(pc.black(" sort the inbox ")));
  const inbox = loadAll(root).filter((n) => typeOf(n) === "Capture" && folderOf(n) === "inbox");
  let done = 0;
  for (const [i, n] of inbox.entries()) {
    const text = captureText(n);
    p.note(text || pc.dim("(empty)"), `${i + 1} of ${inbox.length}`);
    const pick = await ask(p.select({ message: "When?", options: WHEN_OPTIONS, initialValue: whenOfOld(n) ?? "today" }));
    if (pick === BACK || pick === "stop") break;
    if (pick === "skip") continue;
    if (pick === "drop") {
      applyTriage(root, n.path, { outcome: "drop" });
      p.log.info("Deleted. It is in .archive/ if you ever want it.");
      done++;
      continue;
    }
    let when: When = { kind: pick as When["kind"] };
    if (pick === "today") when.due = today();
    if (pick === "date") {
      const answer = await ask(p.text({ message: "Which day? (tomorrow, fri, or YYYY-MM-DD)", initialValue: str(n.meta.due) ?? "", validate: (v) => (v && whenFrom(v)?.due ? undefined : "Use tomorrow, a weekday or YYYY-MM-DD.") }));
      if (answer === BACK) break;
      when = { kind: "date", due: whenFrom(answer)!.due };
    }
    const into = await aboutWhat(root, text, areasOf(n)[0]);
    if (into === BACK) break;
    let withPeople: string[] = [];
    const notes = loadAll(root);
    const people = subjectsNamed(notes, text).filter((x) => typeOf(x) === "Person" && x.path !== into);
    if (when.kind !== "note" && people.length) {
      const all = notes.filter((x) => typeOf(x) === "Person" && folderOf(x) !== DIRS.archive && x.path !== into);
      const picked = await ask(p.multiselect({ message: "Who else?", options: all.map((x) => ({ value: x.path, label: titleOf(x) })), initialValues: people.map((x) => x.path), required: false }));
      if (picked === BACK) break;
      withPeople = picked;
    }
    const again = secondMentions(root, text, notes);
    sortCapture(root, notes, n.path, into, when, { with: withPeople });
    p.log.success(`Added to ${titleOf(readNote(root, into))} as ${when.kind === "note" ? "a note" : "a to-do"}.`);
    for (const mention of again) await offerNote(root, mention);
    done++;
  }
  if (inbox.length) p.log.info(`Sorted ${done} of ${inbox.length}.`);
  else p.log.success("Inbox is clear.");
  if (standalone) p.outro("Inbox done for now.");
  return 0;
}
