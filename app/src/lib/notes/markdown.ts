import { noteHref, resolveLink } from "./model.ts";

export interface ListItem {
  text: string;
  level: number;
  ordered: boolean;
  checked?: boolean;
  section: string;
}

export type Block =
  | { t: "heading"; level: number; text: string }
  | { t: "para"; text: string }
  | { t: "list"; items: ListItem[] }
  | { t: "code"; text: string }
  | { t: "quote"; text: string }
  | { t: "hr" };

const ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

const QUOTE = /^>\s?/;
const FENCE = "```";

type Read = { block?: Block; next: number };
type Reader = (lines: string[], i: number, section: string) => Read | null;

function takeWhile(lines: string[], from: number, keep: (line: string) => boolean): number {
  let end = from;
  while (end < lines.length && keep(lines[end]!)) end++;
  return end;
}

function readCode(lines: string[], i: number): Read | null {
  if (!lines[i]!.trim().startsWith(FENCE)) return null;
  const end = takeWhile(lines, i + 1, (l) => !l.trim().startsWith(FENCE));
  return { block: { t: "code", text: lines.slice(i + 1, end).join("\n") }, next: end + 1 };
}

function readBlank(lines: string[], i: number): Read | null {
  return lines[i]!.trim() ? null : { next: i + 1 };
}

function readHeading(lines: string[], i: number): Read | null {
  const heading = lines[i]!.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/);
  if (!heading) return null;
  return { block: { t: "heading", level: heading[1]!.length, text: heading[2]! }, next: i + 1 };
}

function readRule(lines: string[], i: number): Read | null {
  return /^\s*([-*_])(\s*\1){2,}\s*$/.test(lines[i]!) ? { block: { t: "hr" }, next: i + 1 } : null;
}

function readQuote(lines: string[], i: number): Read | null {
  if (!QUOTE.test(lines[i]!)) return null;
  const end = takeWhile(lines, i, (l) => QUOTE.test(l));
  const text = lines
    .slice(i, end)
    .map((l) => l.replace(QUOTE, ""))
    .join(" ");
  return { block: { t: "quote", text }, next: end };
}

function listItem(m: RegExpMatchArray, section: string): ListItem {
  const box = m[3]!.match(/^\[( |x|X)\]\s+(.*)$/);
  return {
    text: box ? box[2]! : m[3]!,
    level: Math.floor(m[1]!.replace(/\t/g, "  ").length / 2),
    ordered: /\d/.test(m[2]!),
    ...(box && { checked: box[1] !== " " }),
    section,
  };
}

function readList(lines: string[], i: number, section: string): Read | null {
  const end = takeWhile(lines, i, (l) => ITEM.test(l));
  if (end === i) return null;
  const items = lines.slice(i, end).map((l) => listItem(l.match(ITEM)!, section));
  return { block: { t: "list", items }, next: end };
}

const READERS: Reader[] = [readCode, readBlank, readHeading, readRule, readQuote, readList];

function readBlock(lines: string[], i: number, section: string): Read | null {
  for (const reader of READERS) {
    const read = reader(lines, i, section);
    if (read) return read;
  }
  return null;
}

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let section = "";
  let para: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const read = readBlock(lines, i, section);
    if (!read) {
      para.push(lines[i]!.trim());
      i++;
      continue;
    }
    if (para.length) blocks.push({ t: "para", text: para.join(" ") });
    para = [];
    if (read.block?.t === "heading") section = read.block.text;
    if (read.block) blocks.push(read.block);
    i = read.next;
  }
  if (para.length) blocks.push({ t: "para", text: para.join(" ") });
  return blocks;
}

const PATTERNS: { kind: "code" | "link" | "bold" | "italic"; re: RegExp }[] = [
  { kind: "code", re: /`([^`]+)`/ },
  { kind: "link", re: /\[([^\]]+)\]\(([^)\s]+)\)/ },
  { kind: "bold", re: /\*\*(.+?)\*\*|__(.+?)__/ },
  { kind: "italic", re: /(?<![*\w])\*([^*\s][^*]*?)\*(?!\*)|(?<![\w_])_([^_\s][^_]*?)_(?![\w_])/ },
];

export type InlineToken =
  | { t: "text"; text: string }
  | { t: "code"; text: string }
  | { t: "strong" | "em"; children: InlineToken[] }
  | {
      t: "link";
      children: InlineToken[];
      href?: string;
      external?: boolean;
      note?: boolean;
      person?: boolean;
    };

function linkToken(children: InlineToken[], target: string, from: string): InlineToken {
  if (/^(https?:|mailto:|tel:)/i.test(target))
    return { t: "link", children, href: target, external: /^https?:/i.test(target) };
  const path = resolveLink(from, target);
  if (path && path.endsWith(".md"))
    return {
      t: "link",
      children,
      href: noteHref(path),
      note: true,
      person: path.startsWith("people/"),
    };
  return { t: "link", children };
}

export function inline(src: string, from: string): InlineToken[] {
  const out: InlineToken[] = [];
  let rest = src;
  while (rest) {
    let best: { kind: string; m: RegExpExecArray } | null = null;
    for (const p of PATTERNS) {
      const m = p.re.exec(rest);
      if (m && (!best || m.index < best.m.index)) best = { kind: p.kind, m };
    }
    if (!best) {
      out.push({ t: "text", text: rest });
      break;
    }
    const { kind, m } = best;
    if (m.index > 0) out.push({ t: "text", text: rest.slice(0, m.index) });
    const inner = m[1] ?? m[2] ?? "";
    if (kind === "code") out.push({ t: "code", text: inner });
    else if (kind === "link") out.push(linkToken(inline(inner, from), m[2]!, from));
    else out.push({ t: kind === "bold" ? "strong" : "em", children: inline(inner, from) });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}
