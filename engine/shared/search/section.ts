import { plainLine, wordCount } from "./plain.ts";

const SECTION_WORDS = 200;

export interface SectionLine {
  raw: string;
  line: number;
}

function sliceLong(item: SectionLine, limit: number): SectionLine[] {
  const words = item.raw.trim().split(/\s+/);
  if (words.length <= limit) return [item];
  const count = Math.ceil(words.length / limit);
  return Array.from({ length: count }, (_, i) => ({ raw: words.slice(i * limit, (i + 1) * limit).join(" "), line: item.line }));
}

function trimBlank(part: SectionLine[]): SectionLine[] {
  const filled = part.map((item) => item.raw.trim() !== "");
  const first = filled.indexOf(true);
  return first === -1 ? [] : part.slice(first, filled.lastIndexOf(true) + 1);
}

export function splitSection(body: SectionLine[], limit = SECTION_WORDS): SectionLine[][] {
  const parts: SectionLine[][] = [];
  let current: SectionLine[] = [];
  let words = 0;
  for (const item of body.flatMap((line) => sliceLong(line, limit))) {
    const count = wordCount(plainLine(item.raw));
    if (words > 0 && words + count > limit) {
      parts.push(current);
      current = [];
      words = 0;
    }
    current.push(item);
    words += count;
  }
  parts.push(current);
  return parts.map(trimBlank).filter((part) => part.length > 0);
}
