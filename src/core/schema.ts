// Load the rules in .schema/ and check notes against them.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { DIRS, folderOf, tagsOf, typeOf, type Note } from "./notes.ts";

export interface Rule {
  match: string[];
  tags: string[];
}

export interface Schema {
  types: Record<string, string>;
  tags: Set<string>;
  rules: Rule[];
  status: string[];
  outcome: string[];
  filedRequired: string[];
  descriptionMax: number;
  threadStatus: string[];
  privacy: string[];
  lenses: string[];
  eventStatus: string[];
}

export type Issue = { level: "error" | "warn"; message: string };

function load(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  const data = YAML.parse(readFileSync(path, "utf8")) ?? {};
  if (typeof data !== "object" || Array.isArray(data)) throw new Error(`${path} must be a YAML mapping`);
  return data as Record<string, unknown>;
}

const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : v ? [String(v)] : []);

export function loadSchema(root: string): Schema {
  const path = join(root, DIRS.schema);
  const types = load(join(path, "types.yaml"));
  const tags = load(join(path, "tags.yaml"));
  const rules = load(join(path, "rules.yaml"));
  return {
    types: (types.types as Record<string, string>) ?? {},
    tags: new Set(list(tags.tags)),
    rules: (Array.isArray(rules.rules) ? rules.rules : []).map((r: Record<string, unknown>) => ({
      match: list(r.match),
      tags: list(r.tags),
    })),
    status: list(types.status ?? ["draft", "stable", "deprecated"]),
    outcome: list(types.outcome),
    filedRequired: list(types.filed_required ?? ["title", "description"]),
    descriptionMax: Number(types.description_max ?? 150),
    threadStatus: list(types.thread_status ?? ["open", "talked", "parked", "closed"]),
    privacy: list(types.privacy ?? ["full", "headline", "skip"]),
    lenses: list(types.lenses),
    eventStatus: list(types.event_status ?? ["upcoming", "done", "cancelled"]),
  };
}

const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}/.test(String(v)) && !isNaN(Date.parse(String(v).slice(0, 10)));

export function validate(note: Note, schema: Schema): Issue[] {
  const out: Issue[] = [];
  const err = (message: string) => out.push({ level: "error", message });
  const warn = (message: string) => out.push({ level: "warn", message });
  if (note.error) return [{ level: "error", message: note.error }];
  const meta = note.meta;
  if (Object.keys(meta).length === 0) return [{ level: "error", message: "no frontmatter (add a --- block with at least `type`)" }];

  const type = typeOf(note);
  if (!type) err("missing `type`");
  else if (!(type in schema.types)) err(`unknown type \`${type}\` (see .schema/types.yaml)`);

  for (const tag of tagsOf(note)) if (!schema.tags.has(tag)) err(`unknown tag \`${tag}\` (add it to .schema/tags.yaml)`);

  const folder = folderOf(note);
  if (folder !== "inbox" && folder !== DIRS.archive) {
    for (const f of schema.filedRequired) if (!meta[f]) err(`filed note is missing \`${f}\``);
    const expected = type ? schema.types[type] : undefined;
    if (expected && expected !== "inbox" && expected !== folder) warn(`type \`${type}\` belongs in ${expected}/, not ${folder}/`);
  }
  if (meta.description && String(meta.description).length > schema.descriptionMax) warn(`description is over ${schema.descriptionMax} characters`);
  const statuses = type === "Thread" ? schema.threadStatus : type === "Event" ? schema.eventStatus : schema.status;
  if (meta.status && !statuses.includes(String(meta.status))) err(`unknown status \`${meta.status}\``);
  if (meta.privacy && !schema.privacy.includes(String(meta.privacy))) err(`unknown privacy \`${meta.privacy}\` (use ${schema.privacy.join(", ")})`);
  if ((type === "Thread" || type === "Lens") && schema.lenses.length) {
    if (!meta.lens) err("missing `lens`");
    else if (!schema.lenses.includes(String(meta.lens))) err(`unknown lens \`${meta.lens}\` (see .schema/types.yaml)`);
  }
  if (type === "Thread" && meta.depth !== undefined && !Number.isInteger(Number(meta.depth))) err("`depth` must be a whole number");
  for (const message of privacyIssues(note)) warn(message);
  if (meta.outcome && schema.outcome.length && !schema.outcome.includes(String(meta.outcome))) err(`unknown outcome \`${meta.outcome}\``);
  if (type === "Event") {
    if (!meta.date) err("missing `date` (use YYYY-MM-DD)");
    if (meta.due) warn("an Event uses `date`, not `due`");
  }
  for (const f of ["due", "stale_after", "date"]) if (meta[f] && !isDate(meta[f])) err(`\`${f}\` is not a date (use YYYY-MM-DD)`);
  if (meta.area && !/^[a-z0-9-]+$/.test(String(meta.area))) warn("`area` should be the slug of a note in areas/");
  return out;
}

/** Lens notes and threads whose detail goes past the privacy level the owner set. */
export function privacyIssues(n: Note): string[] {
  const out: string[] = [];
  const privacy = n.meta.privacy ? String(n.meta.privacy) : undefined;
  const type = typeOf(n);
  if (type === "Lens") {
    const log = n.body.split(/^# Intake log\s*$/m)[1] ?? "";
    if (privacy === "skip" && /^## \d{4}-/m.test(log)) out.push("this lens is set to skip, but it has intake answers");
    if (privacy === "headline") {
      const long = log.split("\n").filter((l) => l.startsWith("- ") && l.length > 162).length;
      if (long) out.push(`this lens is set to headline, but ${long} answer${long === 1 ? " is" : "s are"} long. Keep one short line each.`);
    }
    if (privacy !== "headline") {
      const plainLen = (l: string) => l.replace(/\s*\(\[raw\]\([^)]*\)\)/g, "").length;
      const long = log.split("\n").filter((l) => l.startsWith("- ") && plainLen(l) > 242).length;
      if (long) out.push(`${long} answer${long === 1 ? " is" : "s are"} long. Distill to one line and keep the full answer with --raw.`);
    }
  }
  if (type === "Thread" && privacy === "skip") out.push("this thread has privacy skip. Close it or change the lens setting.");
  return out;
}
