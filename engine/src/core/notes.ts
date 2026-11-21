import { join, posix } from "node:path";
import YAML from "yaml";

export const DIRS = {
  archive: ".archive",
  templates: ".templates",
  schema: ".schema",
  reports: ".reports",
  cache: ".brain",
} as const;
export const LOG_FILE = ".log.jsonl";

export const NOTE_DIRS = ["inbox", "projects", "areas", "people", "groups", "places", "things", "topics", "events", "resources", "journal", "me", "threads", "goals", "decisions", DIRS.archive];

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;

export type Meta = Record<string, unknown>;

export interface Note {
  path: string;
  meta: Meta;
  body: string;
  mtime: number;
  links: string[];
  error?: string;
}

export { brainHome } from "./home.ts";

export function today(): string {
  if (process.env.BRAIN_TODAY) return process.env.BRAIN_TODAY;
  return localDate(new Date());
}

import { isoDay as localDate } from "../../shared/todos/index.ts";

export { addDays } from "../../shared/todos/index.ts";
export { localDate };

export function nowStamp(): string {
  const date = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${localDate(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function plain(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

export function parse(text: string): { meta: Meta; body: string; error?: string } {
  text = text.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: text };
  const raw = text.slice(4, end);
  let rest = text.slice(end + 4);
  rest = rest.replace(/^[^\n]*\n?/, "").replace(/^\n+/, "");
  try {
    const meta = YAML.parse(raw) ?? {};
    if (typeof meta !== "object" || Array.isArray(meta)) {
      return { meta: {}, body: rest, error: "frontmatter is not a mapping" };
    }
    return { meta: plain(meta) as Meta, body: rest };
  } catch (err) {
    return { meta: {}, body: rest, error: `bad frontmatter: ${(err as Error).message.split("\n")[0]}` };
  }
}

export function dump(meta: Meta, body: string): string {
  const doc = new YAML.Document(meta);
  YAML.visit(doc, {
    Map: (_k, node, path) => {
      if (path.length > 1) node.flow = true;
    },
    Seq: (_k, node) => {
      node.flow = true;
    },
  });
  const head = doc.toString({ lineWidth: 0, flowCollectionPadding: false }).trimEnd();
  return `---\n${head}\n---\n\n${body.trim()}\n`;
}

export const folderOf = (n: Note) => n.path.split("/")[0];
export const slugOf = (n: Note) => posix.basename(n.path, ".md");
export const typeOf = (n: Note) => (typeof n.meta.type === "string" ? n.meta.type : undefined);
export function titleOf(n: Note): string {
  if (n.meta.title) return String(n.meta.title);
  const first = n.body.split("\n").map((l) => l.replace(/^#+\s*/, "").trim()).find(Boolean);
  if (first && (n.meta.type === "Capture" || !n.meta.type)) return first.length > 60 ? first.slice(0, 59) + "…" : first;
  return slugOf(n);
}
export const descOf = (n: Note) => String(n.meta.description ?? "");
export const str = (v: unknown) => (v === undefined || v === null || v === "" ? undefined : String(v));
export function tagsOf(n: Note): string[] {
  const tags = n.meta.tags;
  if (Array.isArray(tags)) return tags.map(String);
  return tags ? [String(tags)] : [];
}
export function areasOf(n: Note): string[] {
  const areas = n.meta.areas;
  if (Array.isArray(areas)) return areas.map(String).filter(Boolean);
  if (areas !== undefined && areas !== null && areas !== "") return [String(areas)];
  const area = str(n.meta.area);
  return area ? [area] : [];
}

export interface Summary {
  path: string;
  type?: string;
  title: string;
  description: string;
  tags: string[];
  area?: string;
  areas?: string[];
  status: string;
  due?: string;
  outcome?: string;
  modified: string;
  subitems?: string[];
}

const EVENT_CLOSED = ["done", "cancelled"];
export function eventDue(n: Note): string | undefined {
  if (typeOf(n) !== "Event" || EVENT_CLOSED.includes(String(n.meta.status))) return undefined;
  return str(n.meta.date)?.slice(0, 10);
}

export function summary(n: Note): Summary {
  return {
    path: n.path,
    type: typeOf(n),
    title: titleOf(n),
    description: descOf(n),
    tags: tagsOf(n),
    area: areasOf(n)[0],
    ...(Array.isArray(n.meta.areas) && { areas: areasOf(n) }),
    status: str(n.meta.status) ?? "stable",
    due: str(n.meta.due) ?? eventDue(n),
    outcome: str(n.meta.outcome),
    modified: localDate(new Date(n.mtime)),
  };
}

export const SLUG = /^[\p{Ll}\p{Lo}\p{Lm}\p{N}\p{M}-]+$/u;

export function extractLinks(notePath: string, body: string): string[] {
  const out: string[] = [];
  const base = posix.dirname(notePath);
  for (const match of body.matchAll(LINK_RE)) {
    let target = match[1];
    if (/^[a-z]+:/i.test(target) || target.startsWith("#")) continue;
    target = decodeURI(target.split("#")[0]);
    if (!target) continue;
    out.push(posix.normalize(posix.join(base, target)));
  }
  return out;
}
