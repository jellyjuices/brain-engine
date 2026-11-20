import { parseToken, SEP } from "../line/index.ts";

const IMAGE = /!\[([^\]]*)\]\([^)]*\)/g;
const LINK = /\[([^\]]*)\]\([^)]*\)/g;
const WIKI = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const MARKER = /^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)/;
const EMPHASIS = /(\*\*|__|\*|`|~~)/g;
const SPACES = /\s+/g;

function isKnownToken(part: string): boolean {
  const token = parseToken(part.trim());
  return token !== null && !("raw" in token);
}

function dropTokens(line: string): string {
  const [head = "", ...rest] = line.split(SEP);
  return [head, ...rest.filter((part) => !isKnownToken(part))].join(SEP);
}

export function plainLine(line: string): string {
  return dropTokens(line)
    .replace(MARKER, "")
    .replace(IMAGE, "$1")
    .replace(LINK, "$1")
    .replace(WIKI, (_, target: string, label?: string) => label ?? target)
    .replace(EMPHASIS, "")
    .split(SEP)
    .join(" ")
    .replace(SPACES, " ")
    .trim();
}

export function plainText(lines: string[]): string {
  return lines.map(plainLine).filter((line) => line !== "").join("\n");
}

export function wordCount(text: string): number {
  return text.split(SPACES).filter((word) => word !== "").length;
}
