import { LOOPS_HEADING } from "./loops.ts";
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

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let section = "";
  let para: string[] = [];
  function flush() {
    if (para.length) blocks.push({ t: "para", text: para.join(" ") });
    para = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.trim().startsWith("```")) {
      flush();
      const code: string[] = [];
      for (i++; i < lines.length && !lines[i]!.trim().startsWith("```"); i++) code.push(lines[i]!);
      blocks.push({ t: "code", text: code.join("\n") });
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      flush();
      section = heading[2]!;
      blocks.push({ t: "heading", level: heading[1]!.length, text: heading[2]! });
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      flush();
      blocks.push({ t: "hr" });
      continue;
    }
    if (/^>\s?/.test(line)) {
      flush();
      const quote: string[] = [line.replace(/^>\s?/, "")];
      while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1]!))
        quote.push(lines[++i]!.replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: quote.join(" ") });
      continue;
    }
    const item = line.match(ITEM);
    if (item) {
      flush();
      const items: ListItem[] = [];
      for (; i < lines.length; i++) {
        const m = lines[i]!.match(ITEM);
        if (!m) break;
        const box = m[3]!.match(/^\[( |x|X)\]\s+(.*)$/);
        items.push({
          text: box ? box[2]! : m[3]!,
          level: Math.floor(m[1]!.replace(/\t/g, "  ").length / 2),
          ordered: /\d/.test(m[2]!),
          ...(box && { checked: box[1] !== " " }),
          section,
        });
      }
      i--;
      blocks.push({ t: "list", items });
      continue;
    }
    para.push(line.trim());
  }
  flush();
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

function isOpenLoop(i: ListItem) {
  return i.checked === false && i.section === LOOPS_HEADING.slice(2);
}

export function pruneOpenLoops(blocks: Block[]): Block[] {
  const kept: Block[] = [];
  for (const b of blocks) {
    if (b.t === "list") {
      const items = b.items.filter((i) => !isOpenLoop(i));
      if (items.length) kept.push({ t: "list", items });
    } else kept.push(b);
  }
  return kept.filter(
    (b, i) =>
      !(
        b.t === "heading" &&
        b.text === LOOPS_HEADING.slice(2) &&
        (kept[i + 1] === undefined || kept[i + 1]!.t === "heading")
      ),
  );
}
