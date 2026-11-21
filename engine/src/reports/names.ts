import { COMMON, FIRST_NAMES, PLACE_WORDS, STOP } from "./name-words.ts";

export function plainText(body: string): string {
  return body
    .replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_]{1,3}/g, "");
}

export function lowerWords(bodies: string[]): Set<string> {
  const out = new Set<string>();
  for (const body of bodies) for (const m of plainText(body).matchAll(/\b[a-z]{3,}\b/g)) out.add(m[0]);
  return out;
}

const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isStop = (word: string) => STOP.has(word.toLowerCase());
const POSSESSIVE = /['’]s$/;

function startsSentence(line: string, index: number): boolean {
  const before = line.slice(0, index).replace(/\s+$/, "");
  return before === "" || /^(?:[-*+]|\d+\.)(?:\s+\[[ xX]\])?$/.test(before) || /[.!?:·—–-]$/.test(before);
}

function isCommonWord(word: string, lower: Set<string>): boolean {
  return COMMON.has(word) || lower.has(word.toLowerCase()) || (word.length > 5 && /ing$/.test(word));
}

function nameFrom(line: string, match: RegExpMatchArray, lower: Set<string>): string | undefined {
  const start = startsSentence(line, match.index ?? 0);
  let words = match[0].split(" ");
  if (start && words.length === 1 && isCommonWord(words[0], lower)) return undefined;
  while (words.length && isStop(words[0])) words = words.slice(1);
  let end = words.length;
  while (end && isStop(words[end - 1])) end--;
  words = words.slice(0, end);
  if (words.length === 1) words = [words[0].replace(POSSESSIVE, "")];
  const weak = !words.length || (words.length === 1 && (isStop(words[0]) || words[0].length < 3));
  return weak ? undefined : words.join(" ");
}

const NAME = /\b(?:(?:St|Mt|Dr|Mr|Mrs|Ms)\. )?[A-Z][a-z]+(?:['’]s)?(?: [A-Z][a-z]+(?:['’]s)?){0,2}\b/g;

export function namesIn(body: string, lower: Set<string> = new Set()): string[] {
  return plainText(body)
    .split("\n")
    .flatMap((line) => (/^\s*#/.test(line) ? [] : [...line.matchAll(NAME)].flatMap((m) => nameFrom(line, m, lower) ?? [])));
}

export function withoutSplitTails(names: string[]): string[] {
  const tails = new Set(names.filter((n) => n.includes(" ")).map((n) => n.split(" ").pop()!.toLowerCase()));
  return names.filter((n) => n.includes(" ") || !tails.has(n.toLowerCase()));
}

const CUE_BEFORE = "with|call|called|calling|met|meet|ask|asked|tell|told|email|emailed|text|texted|thank|thanks to|talk to|talked to|spoke to|spoke with|saw|visit|visited";
const CUE_AFTER = "said|says|told|asked|called|replied|thinks|wants|emailed|texted|mentioned";

function cued(name: string, text: string): boolean {
  const n = reEsc(name);
  return new RegExp(`\\b(?:${CUE_BEFORE}) ${n}\\b|\\b${n} (?:${CUE_AFTER})\\b`, "i").test(text);
}

export function guessKind(name: string, text = ""): "Person" | undefined {
  const words = name.split(" ");
  if (PLACE_WORDS.has(name.toLowerCase()) || words.some((w) => isStop(w))) return undefined;
  const known = FIRST_NAMES.has(words[0].toLowerCase());
  if (words.length === 1) return known || cued(name, text) ? "Person" : undefined;
  return words.length === 2 && known ? "Person" : undefined;
}
