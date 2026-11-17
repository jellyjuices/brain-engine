import type { NoteHead } from "./types.ts";

type Meta = Record<string, string | string[]>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATED_FILE = /(\d{4}-\d{2}-\d{2})\.md$/;
const KEY_LINE = /^([A-Za-z_][\w-]*):\s*(.*)$/;
const LIST_ITEM = /^\s+-\s+(.*)$/;
const H1 = /^#\s+(.+)$/;

function unquote(value: string): string {
  const trimmed = value.trim();
  const quoted = /^(["']).*\1$/.test(trimmed) && trimmed.length >= 2;
  return quoted ? trimmed.slice(1, -1) : trimmed;
}

function scalarOrList(value: string): string | string[] {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return unquote(trimmed);
  const inner = trimmed.slice(1, -1).trim();
  return inner === "" ? [] : inner.split(",").map(unquote);
}

function readMeta(lines: string[]): { meta: Meta; end: number } {
  const meta: Meta = {};
  if (lines[0]?.trim() !== "---") return { meta, end: 0 };
  let key = "";
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "---") return { meta, end: i + 1 };
    const item = line.match(LIST_ITEM);
    const current = meta[key];
    if (item && key && Array.isArray(current)) current.push(unquote(item[1] ?? ""));
    const pair = line.match(KEY_LINE);
    if (!pair) continue;
    key = pair[1] ?? "";
    const value = pair[2] ?? "";
    meta[key] = value.trim() === "" ? [] : scalarOrList(value);
  }
  return { meta: {}, end: 0 };
}

function text(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function list(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter((item) => item !== "");
  return value ? [value] : [];
}

function slugOf(path: string): string {
  return (path.split("/").pop() ?? "").replace(/\.md$/, "");
}

function firstHeading(lines: string[], start: number): string {
  for (const line of lines.slice(start)) {
    const match = line.match(H1);
    if (match) return (match[1] ?? "").trim();
  }
  return "";
}

export function readHead(path: string, lines: string[]): NoteHead {
  const { meta, end } = readMeta(lines);
  const slug = slugOf(path);
  const title = text(meta.title) || firstHeading(lines, end) || slug.replace(/-/g, " ");
  const metaDate = text(meta.date);
  const date = ISO_DATE.test(metaDate) ? metaDate : (path.match(DATED_FILE)?.[1] ?? null);
  const names = [slug.replace(/-/g, " "), ...list(meta.aliases)];
  return { title, description: text(meta.description), names, date, bodyStart: end };
}
