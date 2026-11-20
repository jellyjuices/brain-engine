import { BULLET, liveSegments } from "./live-marks.ts";

export const BOLD = 1;
export const ITALIC = 2;

export interface Rich {
  text: string;
  styles: number[];
}

export interface RichEdit {
  rich: Rich;
  start: number;
  end: number;
}

const WORD = /[\p{L}\p{N}_]/u;

export const EMPTY_RICH: Rich = { text: "", styles: [] };

export function parseRich(markdown: string): Rich {
  const out: Rich = { text: "", styles: [] };
  for (const seg of liveSegments(markdown, { names: [], tags: [] }, false)) {
    if (seg.marks.includes("mark")) continue;
    const style =
      (seg.marks.includes("bold") ? BOLD : 0) | (seg.marks.includes("italic") ? ITALIC : 0);
    out.text += seg.text;
    out.styles.push(...Array.from({ length: seg.text.length }, () => style));
  }
  return out;
}

type Run = [number, number, boolean];

function runs(from: number, to: number, has: (i: number) => boolean): Run[] {
  const out: Run[] = [];
  let start = from;
  for (let i = from + 1; i <= to; i++) {
    if (i < to && has(i) === has(start)) continue;
    out.push([start, i, has(start)]);
    start = i;
  }
  return out;
}

function wrap(
  text: string,
  mark: string,
  inner: (from: number, to: number) => string,
  from: number,
  to: number,
) {
  let a = from;
  let b = to;
  while (a < b && /\s/.test(text[a]!)) a++;
  while (b > a && /\s/.test(text[b - 1]!)) b--;
  if (a === b) return inner(from, to);
  return inner(from, a) + mark + inner(a, b) + mark + inner(b, to);
}

function italicMark(text: string, from: number, to: number) {
  const out = text[from - 1] ?? "";
  const after = text[to] ?? "";
  return WORD.test(out) || WORD.test(after) ? "*" : "_";
}

export function richMarkdown(rich: Rich): string {
  const { text, styles } = rich;
  function has(bit: number) {
    return (i: number) => ((styles[i] ?? 0) & bit) > 0;
  }
  function plain(from: number, to: number) {
    return text.slice(from, to);
  }
  function italics(from: number, to: number): string {
    return runs(from, to, has(ITALIC))
      .map(([a, b, on]) => (on ? wrap(text, italicMark(text, a, b), plain, a, b) : plain(a, b)))
      .join("");
  }
  let at = 0;
  return text
    .split("\n")
    .map((line) => {
      const lead = BULLET.exec(line)?.[0].length ?? 0;
      const from = at + lead;
      at += line.length + 1;
      return (
        line.slice(0, lead) +
        runs(from, from + line.length - lead, has(BOLD))
          .map(([a, b, on]) => (on ? wrap(text, "**", italics, a, b) : italics(a, b)))
          .join("")
      );
    })
    .join("\n");
}

export function wordAt(text: string, at: number): [number, number] {
  let from = at;
  let to = at;
  while (from > 0 && WORD.test(text[from - 1]!)) from--;
  while (to < text.length && WORD.test(text[to]!)) to++;
  return [from, to];
}

export function hasStyle(rich: Rich, start: number, end: number, bit: number): boolean {
  if (start === end) return ((rich.styles[start - 1] ?? 0) & bit) > 0;
  for (let i = start; i < end; i++) {
    if (/\s/.test(rich.text[i]!)) continue;
    if (!((rich.styles[i] ?? 0) & bit)) return false;
  }
  return true;
}

export function toggleStyle(rich: Rich, start: number, end: number, bit: number): RichEdit {
  const [from, to] = start === end ? wordAt(rich.text, start) : [start, end];
  if (from === to) return { rich, start, end };
  const on = !hasStyle(rich, from, to, bit);
  const styles = rich.styles.map((s, i) => (i < from || i >= to ? s : on ? s | bit : s & ~bit));
  return { rich: { text: rich.text, styles }, start, end };
}

export function replaceText(rich: Rich, next: string, typing?: number): Rich {
  const old = rich.text;
  let head = 0;
  while (head < old.length && head < next.length && old[head] === next[head]) head++;
  let tail = 0;
  while (
    tail < old.length - head &&
    tail < next.length - head &&
    old[old.length - 1 - tail] === next[next.length - 1 - tail]
  )
    tail++;
  const added = next.length - head - tail;
  const inherit = typing ?? (old[head - 1] === "\n" ? 0 : (rich.styles[head - 1] ?? 0));
  const styles = [
    ...rich.styles.slice(0, head),
    ...Array.from({ length: added }, () => inherit),
    ...rich.styles.slice(old.length - tail),
  ];
  return { text: next, styles };
}

export function changedAt(old: string, next: string): number {
  let head = 0;
  while (head < old.length && head < next.length && old[head] === next[head]) head++;
  return head;
}
