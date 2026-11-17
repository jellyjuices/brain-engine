import { dump, parse } from "../../src/core/notes.ts";
import { migrateBody } from "./body.ts";
import { migrateMeta, needsAreas } from "./frontmatter.ts";

export type ChangeKind = "area" | "outcome" | "general" | "capture" | "heading" | "token";

export interface Change {
  path: string;
  kind: ChangeKind;
  what: string;
}

export interface OwnerLists {
  needsAreas: string[];
  undated: string[];
  outside: string[];
  bothHeadings: string[];
  badFrontmatter: string[];
}

export const emptyLists = (): OwnerLists => ({ needsAreas: [], undated: [], outside: [], bothHeadings: [], badFrontmatter: [] });

export interface NoteResult {
  text: string;
  changes: Change[];
  lists: OwnerLists;
}

export function migrateText(path: string, raw: string): NoteResult {
  const text = raw.replace(/\r\n/g, "\n");
  const lists = emptyLists();
  const { meta, body, error } = parse(text);
  if (error) {
    lists.badFrontmatter.push(path);
    return { text: raw, changes: [], lists };
  }
  const m = migrateMeta(meta);
  const b = migrateBody(body, text.split("\n").length - body.split("\n").length + 1);
  const at = (line: number) => `${path}:${line}`;
  if (needsAreas(m.meta)) lists.needsAreas.push(path);
  if (b.bothHeadings) lists.bothHeadings.push(path);
  lists.undated.push(...b.undated.map(at));
  lists.outside.push(...b.outside.map(at));
  const changes: Change[] = [...m.changes, ...b.changes].map((c) => ({ path, ...c }));
  if (!changes.length) return { text: raw, changes, lists };
  const sameHead = !m.changes.length && text.endsWith(body);
  const next = sameHead ? text.slice(0, text.length - body.length) + b.body : dump(m.meta, b.body);
  return { text: next, changes, lists };
}

export function mergeLists(into: OwnerLists, from: OwnerLists): void {
  for (const key of Object.keys(into) as (keyof OwnerLists)[]) into[key].push(...from[key]);
}
