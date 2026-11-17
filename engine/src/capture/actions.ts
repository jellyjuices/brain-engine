// Things that change notes: capture, new note, tag, sort, triage, intake.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DIRS, dump, folderOf, type Meta, type Note, nowStamp, parse, tagsOf, today, typeOf } from "../core/notes.ts";
import { loadAll, moveNote, readNote, slugify, uniquePath, writeAtomic, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { loadSchema, type Schema } from "../core/schema.ts";
import { isOwnerWriter } from "../core/owner.ts";


export interface CaptureInput {
  text: string;
  tags?: string[];
  area?: string;
  clientId?: string;
  createdAt?: string;
  by?: string;
}

/** Write one Capture note to inbox/. A repeat clientId returns the existing note. */
export function capture(root: string, input: CaptureInput): Note {
  if (input.clientId) {
    const existing = loadAll(root).find((n) => n.meta.client_id === input.clientId);
    if (existing) return existing;
  }
  const created = (input.createdAt ?? nowStamp()).slice(0, 16); // YYYY-MM-DDTHH:MM
  const stamp = created.replace(":", "").replace("T", "-"); // YYYY-MM-DD-HHMM
  const rel = uniquePath(root, "inbox", `${stamp}-${slugify(input.text.split("\n")[0], 40)}`);
  // Keep labels few: the type and one time stamp. client_id only when the phone sends one (to skip repeats).
  const meta: Meta = { type: "Capture", created };
  if (input.clientId) meta.client_id = input.clientId;
  if (input.tags?.length) meta.tags = input.tags;
  if (input.area) meta.area = input.area;
  // Who wrote it matters only when it was not the owner.
  if (input.by && !isOwnerWriter(input.by)) meta.generated = { by: input.by, at: created };
  const note = writeNote(root, rel, meta, input.text);
  log(root, `added ${rel}`);
  return note;
}


export function newNote(root: string, type: string, title: string, extra: Meta = {}): Note {
  const schema = loadSchema(root);
  const folder = schema.types[type];
  if (!folder) throw new Error(`unknown type ${type}. Use one of: ${Object.keys(schema.types).join(", ")}`);
  const tpl = join(root, DIRS.templates, `${type.toLowerCase()}.md`);
  const { meta, body } = existsSync(tpl) ? parse(readFileSync(tpl, "utf8")) : { meta: { type } as Meta, body: "" };
  const at = nowStamp();
  const filled: Meta = { ...meta, type, title, ...extra };
  if (!filled.description) filled.description = "";
  if (Array.isArray(meta.areas) && extra.area) {
    filled.areas = [String(extra.area)];
    delete filled.area;
  }
  const rel = uniquePath(root, folder, slugify(title));
  writeAtomic(join(root, rel), dump(filled, body.replaceAll("{{title}}", title).replaceAll("{{date}}", at)));
  log(root, `created ${rel}`);
  return readNote(root, rel);
}


export function ruleTags(text: string, schema: Schema): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const rule of schema.rules) {
    const hit = rule.match.some((word) => new RegExp(`(^|[^\\p{L}\\p{N}])${word.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "u").test(lower));
    if (hit) for (const tag of rule.tags) if (schema.tags.has(tag)) found.add(tag);
  }
  return [...found];
}

/** Add tags to inbox notes from .schema/rules.yaml. Never adds a tag that is not in tags.yaml. */
export function tagInbox(root: string, dryRun = false): { path: string; added: string[] }[] {
  const schema = loadSchema(root);
  const out: { path: string; added: string[] }[] = [];
  for (const note of loadAll(root).filter((n) => folderOf(n) === "inbox")) {
    const have = tagsOf(note);
    const added = ruleTags(`${note.meta.title ?? ""} ${note.body}`, schema).filter((t) => !have.includes(t));
    if (!added.length) continue;
    out.push({ path: note.path, added });
    if (!dryRun) {
      writeNote(root, note.path, { ...note.meta, tags: [...have, ...added] }, note.body);
      log(root, `tagged ${note.path}: ${added.join(", ")}`);
    }
  }
  return out;
}


export type SortResult = { path: string; to?: string; reason?: string };

export function sortOne(root: string, n: Note, schema: Schema, dryRun = false): SortResult {
  const type = typeOf(n);
  if (!type || type === "Capture") return { path: n.path, reason: "still a Capture (set a type first)" };
  const folder = schema.types[type];
  if (!folder) return { path: n.path, reason: `unknown type ${type}` };
  if (folder === "inbox") return { path: n.path, reason: "type stays in inbox" };
  if (!n.meta.title || !n.meta.description) return { path: n.path, reason: "needs a title and a description" };
  const to = uniquePath(root, folder, slugify(String(n.meta.title)));
  if (!dryRun) {
    moveNote(root, n.path, to, n.meta, n.body);
    log(root, `filed ${n.path} → ${to}`);
  }
  return { path: n.path, to };
}

/** Move inbox notes that have a type, title and description to their folder. */
export function sortInbox(root: string, dryRun = false): SortResult[] {
  const schema = loadSchema(root);
  return loadAll(root)
    .filter((n) => folderOf(n) === "inbox")
    .map((n) => sortOne(root, n, schema, dryRun));
}


/** keep = a fact or an idea with nothing to do. It is filed as a dated note line, not a to-do. */
export const OUTCOMES = ["today", "date", "someday", "waiting", "keep", "drop"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export interface TriageDecision {
  outcome: Outcome;
  type?: string;
  area?: string;
  title?: string;
  description?: string;
  due?: string;
  /** Set the labels only. Do not file by type (the caller absorbs it into a subject note next). */
  keepCapture?: boolean;
}

/** Apply one triage decision. drop moves the note to .archive/ (never deletes). */
export function applyTriage(root: string, path: string, d: TriageDecision): SortResult {
  const note = readNote(root, path);
  const meta: Meta = { ...note.meta, outcome: d.outcome };
  if (d.type) meta.type = d.type;
  if (d.area) meta.area = d.area;
  if (d.title) meta.title = d.title;
  if (d.description) meta.description = d.description;
  if (d.due) meta.due = d.due;
  if (d.outcome === "drop") {
    const to = uniquePath(root, DIRS.archive, slugify(String(meta.title ?? note.path.split("/").pop()!.replace(/\.md$/, ""))));
    moveNote(root, note.path, to, meta, note.body);
    log(root, `dropped ${note.path} → ${to}`);
    return { path, to };
  }
  writeNote(root, note.path, meta, note.body);
  log(root, `triaged ${note.path}: ${d.outcome}`);
  if (d.keepCapture) return { path };
  return sortOne(root, readNote(root, note.path), loadSchema(root));
}


export const AREA_QUESTIONS = [
  "What is going on here right now?",
  "What has a date or a deadline?",
  "What worries you most about it?",
  "Who else is involved?",
  'What would "handled" look like?',
];

/** Round 1: save a brain dump. Each non-empty line becomes its own inbox note. */
export function brainDump(root: string, text: string, opts: { single?: boolean; area?: string } = {}): Note[] {
  const tags = ["intake"];
  if (opts.single) return [capture(root, { text, tags, area: opts.area })];
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*([-*•]|\d+[.)])\s+/, "").trim())
    .filter(Boolean)
    .map((line) => capture(root, { text: line, tags, area: opts.area }));
}

/** Round 3: save the answers to the 5 area questions in the area note. */
export function saveAreaIntake(root: string, area: string, answers: string[]): Note {
  const rel = `areas/${area}.md`;
  if (!existsSync(join(root, rel))) throw new Error(`no area note at ${rel}`);
  const n = readNote(root, rel);
  const block = [`## Intake ${today()}`, "", ...AREA_QUESTIONS.flatMap((q, i) => [`**${q}**`, "", (answers[i] ?? "").trim() || "_No answer._", ""])].join("\n");
  const note = writeNote(root, rel, n.meta, `${n.body.trimEnd()}\n\n${block}`);
  log(root, `area intake for ${area}`);
  return note;
}
