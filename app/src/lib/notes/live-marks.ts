export type Mark = "mark" | "bold" | "italic" | "mention" | "bullet";

export interface Segment {
  text: string;
  marks: Mark[];
}

export interface Picked {
  names: string[];
  tags: string[];
}

interface Hit {
  index: number;
  length: number;
  open: string;
  inner: string;
  mark: Mark | null;
}

const BOLD = /\*\*(?=[^\s*])([^\n]*?[^\s*])\*\*/;
const ITALIC = /(?<![\p{L}\p{N}*_])([*_])(?=[^\s*_])([^\n]*?[^\s*_])\1(?![\p{L}\p{N}*_])/u;
const EMPTY = /(?<!\S)(\*\*\*\*|__)(?!\S)/;
const BULLET = /^(\s*)([-*] )/;

function escaped(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function picker(picked: Picked): RegExp | null {
  const words = [
    ...picked.names.filter(Boolean).map((n) => `@${escaped(n)}`),
    ...picked.tags.filter(Boolean).map((t) => `#${escaped(t)}`),
  ].sort((a, b) => b.length - a.length);
  return words.length ? new RegExp(`(?:${words.join("|")})(?![\\p{L}\\p{N}_-])`, "u") : null;
}

function earliest(src: string, chips: RegExp | null): Hit | null {
  const found: Hit[] = [];
  const bold = BOLD.exec(src);
  if (bold)
    found.push({
      index: bold.index,
      length: bold[0].length,
      open: "**",
      inner: bold[1]!,
      mark: "bold",
    });
  const italic = ITALIC.exec(src);
  if (italic)
    found.push({
      index: italic.index,
      length: italic[0].length,
      open: italic[1]!,
      inner: italic[2]!,
      mark: "italic",
    });
  const empty = EMPTY.exec(src);
  if (empty)
    found.push({
      index: empty.index,
      length: empty[0].length,
      open: empty[0],
      inner: "",
      mark: null,
    });
  const chip = chips?.exec(src);
  if (chip)
    found.push({
      index: chip.index,
      length: chip[0].length,
      open: "",
      inner: chip[0],
      mark: "mention",
    });
  return found.sort((a, b) => a.index - b.index)[0] ?? null;
}

function push(out: Segment[], text: string, marks: Mark[]) {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.marks.join() === marks.join()) last.text += text;
  else out.push({ text, marks });
}

function scan(src: string, marks: Mark[], chips: RegExp | null, out: Segment[]) {
  let rest = src;
  while (rest) {
    const hit = earliest(rest, chips);
    if (!hit) break;
    push(out, rest.slice(0, hit.index), marks);
    if (hit.mark === "mention") push(out, hit.inner, [...marks, "mention"]);
    else if (!hit.mark) push(out, hit.open, [...marks, "mark"]);
    else {
      push(out, hit.open, [...marks, "mark"]);
      scan(hit.inner, [...marks, hit.mark], chips, out);
      push(out, hit.open, [...marks, "mark"]);
    }
    rest = rest.slice(hit.index + hit.length);
  }
  push(out, rest, marks);
}

export function liveSegments(value: string, picked: Picked, lists = true): Segment[] {
  const chips = picker(picked);
  const out: Segment[] = [];
  value.split("\n").forEach((line, i) => {
    if (i > 0) push(out, "\n", []);
    const bullet = lists ? BULLET.exec(line) : null;
    if (bullet) {
      push(out, bullet[1]!, []);
      push(out, bullet[2]!, ["bullet"]);
    }
    scan(bullet ? line.slice(bullet[0].length) : line, [], chips, out);
  });
  return out;
}
