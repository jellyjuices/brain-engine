import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { areasOf, slugOf, str, typeOf, type Note } from "./notes.ts";
import type { Issue, Schema } from "./schema.ts";

export const AREAS_MIN = 1;
export const AREAS_MAX = 3;
export const AREAS_REQUIRED = ["Goal", "Decision"];
export const KIND_SECTIONS: Record<string, string[]> = {
  Goal: ["# Why", "# Targets", "# Wins", "# Notes"],
  Decision: ["# Rants", "# Buckets", "# Options", "# Decided"],
};

const SLUG = /^[a-z0-9-]+$/;
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}/.test(String(v)) && !isNaN(Date.parse(String(v).slice(0, 10)));
const error = (message: string): Issue => ({ level: "error", message });
const warn = (message: string): Issue => ({ level: "warn", message });

export function statusesFor(type: string | undefined, schema: Schema): string[] {
  if (type === "Thread") return schema.threadStatus;
  if (type === "Event") return schema.eventStatus;
  if (type === "Goal") return schema.goalStatus;
  if (type === "Decision") return schema.decisionStatus;
  return schema.status;
}

export function areaIssues(n: Note): Issue[] {
  const type = typeOf(n);
  const hasAreas = n.meta.areas !== undefined;
  const required = !!type && AREAS_REQUIRED.includes(type);
  if (!hasAreas && !required) return [];
  const areas = areasOf(n);
  const out: Issue[] = [];
  if (hasAreas && !Array.isArray(n.meta.areas)) out.push(warn("`areas` should be a list, like [health]"));
  if (areas.length < AREAS_MIN || areas.length > AREAS_MAX) out.push(error(`\`areas\` must list ${AREAS_MIN} to ${AREAS_MAX} areas, not ${areas.length}`));
  for (const a of areas) if (!SLUG.test(a)) out.push(warn(`area \`${a}\` should be the slug of a note in areas/`));
  return out;
}

function sectionIssues(n: Note, type: string): Issue[] {
  const headings = new Set(n.body.split("\n").map((l) => l.trim()));
  return (KIND_SECTIONS[type] ?? []).filter((h) => !headings.has(h)).map((h) => warn(`missing section \`${h}\``));
}

export function kindIssues(n: Note): Issue[] {
  const type = typeOf(n);
  const out = areaIssues(n);
  if (type !== "Goal" && type !== "Decision") return out;
  out.push(...sectionIssues(n, type));
  if (type === "Decision") {
    if (n.meta.decide_by && !isDate(n.meta.decide_by)) out.push(error("`decide_by` is not a date (use YYYY-MM-DD)"));
    if (n.meta.subjects !== undefined && !Array.isArray(n.meta.subjects)) out.push(warn("`subjects` should be a list of links"));
  }
  if (type === "Goal" && str(n.meta.parent) && !parentSlug(n)) out.push(error("`parent` should be the slug of a note in goals/"));
  return out;
}

export function parentSlug(n: Note): string | undefined {
  const raw = str(n.meta.parent);
  if (!raw) return undefined;
  const target = raw.match(/\]\(([^)\s]+)\)/)?.[1] ?? raw;
  const slug = posix.basename(target, ".md");
  return SLUG.test(slug) ? slug : undefined;
}

export function goalTreeIssues(root: string, notes: Note[]): [string, Issue][] {
  const goals = new Map(notes.filter((n) => typeOf(n) === "Goal" && n.path.startsWith("goals/")).map((n) => [slugOf(n), n]));
  const out: [string, Issue][] = [];
  for (const n of notes) {
    const type = typeOf(n);
    if (n.meta.areas !== undefined || (type && AREAS_REQUIRED.includes(type))) {
      for (const a of areasOf(n)) if (SLUG.test(a) && !existsSync(join(root, "areas", `${a}.md`))) out.push([n.path, warn(`area \`${a}\` has no note in areas/`)]);
    }
    if (type !== "Goal" || !n.path.startsWith("goals/")) continue;
    const slug = parentSlug(n);
    if (slug) {
      const parent = goals.get(slug);
      if (!parent) out.push([n.path, error(`\`parent\` goal \`${slug}\` has no note in goals/`)]);
      else if (parent === n) out.push([n.path, error("a goal cannot be its own parent")]);
      else if (parentSlug(parent)) out.push([n.path, error(`\`parent\` goal \`${slug}\` is a subgoal itself. Goals go one level deep only`)]);
    }
  }
  return out;
}
