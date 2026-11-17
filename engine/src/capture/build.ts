// One-call builder: a new note with its fields, areas, parent, sections, relations and to-dos, written once.
// One write is one log entry, so one undo takes the whole note back.

import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { appendToSection, LOOPS_HEADING, newTodoLine, type TodoPatch } from "../../shared/line/index.ts";
import { type Meta, type Note, SLUG, slugOf, titleOf, today, typeOf } from "../core/notes.ts";
import { nextAreaColor } from "../core/area-colors.ts";
import { readNote } from "../core/files.ts";
import { headingForType } from "../core/relations.ts";
import { loadSchema } from "../core/schema.ts";
import { parentSlug, statusesFor } from "../core/schema-kinds.ts";
import { draftNote, writeDraft } from "./actions.ts";
import { whenFrom } from "./file.ts";

export interface RelationInput {
  to: string;
  role?: string;
  time?: string;
}

export interface TodoInput {
  text: string;
  when?: string;
  toward?: string;
}

export interface BuildSpec {
  type: string;
  title: string;
  description?: string;
  fields?: Record<string, string | string[]>;
  areas?: string[];
  parent?: string;
  sections?: Record<string, string[]>;
  relations?: RelationInput[];
  todos?: TodoInput[];
  extra?: Meta;
}

export const FIELD_NAMES = ["why", "when", "date", "with", "decide_by", "subjects", "birthday", "from", "renews", "status"];
const DATE_FIELDS = ["date", "decide_by", "birthday", "renews"];
const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const clean = (v: string | undefined) => v?.replace(/[·\n]/g, " ").trim() || undefined;

function fieldMeta(fields: BuildSpec["fields"], type: string, root: string): Meta {
  const out: Meta = {};
  for (const [key, value] of Object.entries(fields ?? {})) {
    if (!FIELD_NAMES.includes(key)) throw new Error(`"fields" cannot set ${key}. Use one of: ${FIELD_NAMES.join(", ")}.`);
    if (DATE_FIELDS.includes(key) && value !== "" && !(typeof value === "string" && isDay(value))) throw new Error(`"${key}" must look like 2026-11-20.`);
    if (key === "status" && !statusesFor(type, loadSchema(root)).includes(String(value))) throw new Error(`"status" must be one of: ${statusesFor(type, loadSchema(root)).join(", ")}.`);
    out[key] = value;
  }
  return out;
}

function areaMeta(root: string, areas: string[] | undefined): Meta {
  if (!areas) return {};
  if (!areas.length) throw new Error(`"areas" needs at least one area.`);
  for (const a of areas) if (!SLUG.test(a) || !existsSync(join(root, "areas", `${a}.md`))) throw new Error(`No area "${a}". Areas are notes in areas/.`);
  return { areas: [...new Set(areas)] };
}

function parentMeta(root: string, type: string, raw: string | undefined): Meta {
  if (!raw) return {};
  if (type !== "Goal") throw new Error(`Only a Goal has a "parent".`);
  const path = raw.endsWith(".md") ? raw : `goals/${raw}.md`;
  if (!path.startsWith("goals/") || !existsSync(join(root, path))) throw new Error(`No goal at ${path}.`);
  const parent = readNote(root, path);
  if (typeOf(parent) !== "Goal") throw new Error(`${path} is not a goal.`);
  if (parentSlug(parent)) throw new Error(`${path} is a subgoal. Goals go one level deep only.`);
  return { parent: slugOf(parent) };
}

function target(root: string, path: string): Note {
  if (!existsSync(join(root, path))) throw new Error(`No note at ${path}.`);
  return readNote(root, path);
}

const linkTo = (from: string, to: Note) => `[${titleOf(to).split(",")[0]}](${posix.relative(posix.dirname(from), to.path)})`;

function todoPatch(t: TodoInput, rel: string, root: string): TodoPatch & { text: string } {
  const when = t.when ? whenFrom(t.when) : undefined;
  if (t.when && !when) throw new Error(`"${t.when}" is not a day I know.`);
  const outcome = !when || when.kind === "date" || when.kind === "note" ? undefined : when.kind;
  const due = when && (when.kind === "date" || when.kind === "today") ? (when.due ?? today()) : undefined;
  const toward = t.toward ? [linkTo(rel, target(root, t.toward))] : undefined;
  return { text: t.text.trim(), ...(due && { due }), ...(outcome && outcome !== "today" && { outcome }), ...(toward && { toward }) };
}

export function buildNote(root: string, spec: BuildSpec): Note {
  const fields = fieldMeta(spec.fields, spec.type, root);
  const color = spec.type === "Area" ? nextAreaColor(root) : undefined;
  const extra: Meta = { ...(color && { color }), ...fields, ...areaMeta(root, spec.areas), ...parentMeta(root, spec.type, spec.parent), description: spec.description ?? "", ...spec.extra };
  const draft = draftNote(root, spec.type, spec.title, extra);
  if (spec.areas) delete draft.meta.area;
  let body = draft.body;
  for (const [heading, lines] of Object.entries(spec.sections ?? {})) for (const line of lines) body = appendToSection(body, heading.startsWith("#") ? heading : `# ${heading}`, line);
  const seen = new Set<string>();
  for (const r of spec.relations ?? []) {
    if (seen.has(r.to) || r.to === draft.rel) continue;
    seen.add(r.to);
    const note = target(root, r.to);
    const line = [`- ${linkTo(draft.rel, note)}`, clean(r.role), clean(r.time)].filter(Boolean).join(" · ");
    body = appendToSection(body, headingForType(typeOf(note)), line);
  }
  for (const t of spec.todos ?? []) body = appendToSection(body, LOOPS_HEADING, newTodoLine(todoPatch(t, draft.rel, root)));
  return writeDraft(root, { ...draft, body });
}

