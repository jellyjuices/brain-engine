import { posix } from "node:path";
import { appendToSection, LOOPS_HEADING, newTodoLine, NOTES_HEADING, SEP, type TodoPatch } from "../../shared/line/index.ts";
import { type SortSubject, subjectsNamed } from "../../shared/sort/index.ts";
import { whenFrom } from "../capture/file.ts";
import { loadAll, readNote } from "../core/files.ts";
import { dump, type Note, titleOf, today } from "../core/notes.ts";
import { sortSubjects } from "../sort/guess.ts";
import type { Job } from "../interface/api-types-jobs.ts";
import { keepQuoted } from "./guard.ts";
import type { Plan, PlanFile } from "./plan.ts";
import { ask } from "./runner.ts";
import { SPLIT_SCHEMA, SPLIT_SYSTEM, type SplitItem, type SplitReply, splitUser } from "./split-ask.ts";

const MAX_SUBJECTS = 300;
const GENERAL = "areas/general.md";
const ASK = "split";
const isPrivate = (path: string) => path.startsWith("me/");

function splitSubjects(notes: readonly Note[], file: Note): SortSubject[] {
  const open = sortSubjects(notes).filter((s) => s.path !== file.path && !isPrivate(s.path));
  const named = subjectsNamed(open, file.body).slice(0, MAX_SUBJECTS);
  const general = open.find((s) => s.path === GENERAL);
  return general && !named.includes(general) ? [...named, general] : named;
}

const oneLine = (text: string) => text.replace(/\s+/g, " ").trim().split(SEP).join(", ");

function whenPatch(word: string | undefined): TodoPatch {
  const when = word ? whenFrom(word) : undefined;
  if (!when || when.kind === "note") return {};
  if (when.kind === "someday" || when.kind === "waiting") return { outcome: when.kind };
  return { due: when.due ?? today() };
}

interface Mark {
  text: string;
  by: string;
  from: string;
}

function todoLine(item: SplitItem, m: Mark): string {
  return newTodoLine({ ...m, ...whenPatch(item.when), ...(item.check && { check: true }) });
}

function factLine(item: SplitItem, m: Mark): string {
  return `- ${today()}${SEP}${[m.text, item.check && "check", `by ${m.by}`, `from ${m.from}`].filter(Boolean).join(SEP)}`;
}

function linkBack(into: string, file: Note): string {
  return `[${oneLine(titleOf(file)).replace(/[[\]]/g, "")}](${posix.relative(posix.dirname(into), file.path)})`;
}

function filed(notes: readonly Note[], file: Note, items: readonly SplitItem[], by: string): PlanFile[] {
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const bodies = new Map<string, string>();
  for (const item of items) {
    const mark = { text: oneLine(item.text), by: oneLine(by), from: linkBack(item.into, file) };
    const body = bodies.get(item.into) ?? byPath.get(item.into)!.body;
    const added = item.kind === "todo" ? appendToSection(body, LOOPS_HEADING, todoLine(item, mark)) : appendToSection(body, NOTES_HEADING, factLine(item, mark));
    bodies.set(item.into, added);
  }
  return [...bodies].map(([path, body]) => ({ path, text: dump(byPath.get(path)!.meta, body) }));
}

function askDone(file: Note): PlanFile {
  const asks = (Array.isArray(file.meta.asks) ? file.meta.asks.map(String) : []).filter((a) => a !== ASK);
  const meta = Object.fromEntries(Object.entries(file.meta).filter(([k]) => k !== "asks"));
  return { path: file.path, text: dump(asks.length ? { ...meta, asks } : meta, file.body) };
}

export async function runSplit(root: string, job: Job, signal: AbortSignal): Promise<Plan> {
  if (isPrivate(job.note)) throw new Error("Split does not read private notes.");
  const notes = loadAll(root);
  const file = readNote(root, job.note);
  const subjects = splitSubjects(notes, file);
  const reply = (await ask({ kind: "split", system: SPLIT_SYSTEM, user: splitUser(file.body, subjects), schema: SPLIT_SCHEMA, maxTokens: 4000, temperature: 0.2, signal })) as SplitReply;
  const { kept, no_quote, off_list } = keepQuoted(file.body, reply.items.filter((i) => oneLine(i.text)), new Set(subjects.map((s) => s.path)));
  const files = filed(notes, file, kept, job.by ?? "helper");
  const counts = { todos: kept.filter((i) => i.kind === "todo").length, facts: kept.filter((i) => i.kind === "fact").length, check: kept.filter((i) => i.check).length, no_quote, off_list };
  return { msg: `split: ${job.note} into ${files.length} subjects`, files: [...files, askDone(file)], counts };
}
