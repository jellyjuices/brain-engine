import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import YAML from "yaml";
import { DIRS, typeOf, type Note } from "./notes.ts";
import { kindIssues } from "./schema-kinds.ts";
import { CHECKS } from "./schema-checks.ts";

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
  goalStatus: string[];
  projectStatus: string[];
  areaColors: string[];
  decisionStatus: string[];
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
    goalStatus: list(types.goal_status ?? ["active", "later", "done"]),
    projectStatus: list(types.project_status ?? ["active", "finished", "stable", "draft", "deprecated"]),
    areaColors: list(types.area_colors),
    decisionStatus: list(types.decision_status ?? ["open", "decided", "dropped"]),
  };
}

export function validate(note: Note, schema: Schema): Issue[] {
  if (note.error) return [{ level: "error", message: note.error }];
  if (Object.keys(note.meta).length === 0) return [{ level: "error", message: "no frontmatter (add a --- block with at least `type`)" }];
  const input = { note, meta: note.meta, schema, type: typeOf(note) };
  return [...CHECKS.flatMap((check) => check(input)), ...kindIssues(note)];
}
