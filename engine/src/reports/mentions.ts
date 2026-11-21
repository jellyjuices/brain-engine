import { posix } from "node:path";
import { DIRS, folderOf, type Note, titleOf, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { SUBJECT_TYPES } from "./card.ts";

export const MAX_WARN_LINES = 10;
const MENTION_TYPES = ["Person", "Group", "Place", "Thing", "Topic", "Project"];
const filed = (n: Note) => folderOf(n) !== "inbox" && folderOf(n) !== DIRS.archive && folderOf(n) !== "journal";

const STOP = new Set(
  `the a an and but or if so then when what who where why how this that these those there here my our your his her their its i we he she it they you me us
  not no yes ok also just now today tomorrow yesterday soon later maybe note notes todo to do done ask call book email buy pay send check chase get make talk follow see
  need needs want wants have has had will would should could can may might must about after before during with without for from into over under
  jan feb mar apr may jun jul aug sep sept oct nov dec january february march april june july august september october november december
  monday tuesday wednesday thursday friday saturday sunday canadian canada christmas easter
  mac english french spanish german italian japanese chinese portuguese korean arabic hindi`.split(/\s+/),
);

function plainText(body: string): string {
  return body
    .replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_]{1,3}/g, "");
}

const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function unlinkedMentions(notes: Note[]): [string, string][] {
  const subjects = notes.filter((n) => filed(n) && MENTION_TYPES.includes(typeOf(n) ?? "") && titleOf(n).trim().length >= 3);
  const out: [string, string][] = [];
  for (const n of notes.filter(filed)) {
    const text = plainText(n.body);
    for (const note of subjects) {
      if (note.path === n.path || n.links.includes(note.path)) continue;
      const title = titleOf(note).trim();
      if (new RegExp(`(?<![\\p{L}\\p{N}])${reEsc(title)}(?![\\p{L}\\p{N}])`, "u").test(text)) out.push([n.path, `${posix.basename(n.path)} mentions ${title}, not linked.`]);
    }
  }
  return out.slice(0, MAX_WARN_LINES);
}

const PLACE_WORDS = new Set("canada vancouver montreal ottawa calgary halifax quebec winnipeg mississauga hamilton kitchener waterloo".split(" "));

export const guessKind = (name: string): "Person" | undefined => (name.includes(" ") || PLACE_WORDS.has(name.toLowerCase()) ? undefined : "Person");

export interface Mention {
  name: string;
  notes: string[];
  suggest: "Person" | undefined;
}

export function knownNames(notes: Note[]): Set<string> {
  const known = new Set<string>();
  for (const note of notes) {
    if (folderOf(note) === "inbox") continue;
    const title = titleOf(note);
    const aliases = Array.isArray(note.meta.aliases) ? note.meta.aliases.map(String) : [];
    for (const line of [title, title.split(",")[0], posix.basename(note.path, ".md").replace(/-/g, " "), ...aliases]) known.add(line.trim().toLowerCase());
    if (typeOf(note) === "Person") known.add(title.split(/[\s,]+/)[0].toLowerCase());
  }
  return known;
}

const isStop = (word: string) => STOP.has(word.toLowerCase());

function startsSentence(line: string, index: number): boolean {
  const before = line.slice(0, index).replace(/\s+$/, "");
  return before === "" || /^(?:[-*+]|\d+\.)(?:\s+\[[ xX]\])?$/.test(before) || /[.!?:·—–-]$/.test(before);
}

function leadTrimmed(words: string[], atStart: boolean): string[] {
  if (!atStart) return words;
  if (isStop(words[0])) return words.slice(1);
  return words.length === 1 ? [] : words;
}

function tailTrimmed(words: string[]): string[] {
  let end = words.length;
  while (end && isStop(words[end - 1])) end--;
  return words.slice(0, end);
}

const tooWeak = (words: string[]) => !words.length || (words.length === 1 && (isStop(words[0]) || words[0].length < 3));

function nameFrom(line: string, match: RegExpMatchArray): string | undefined {
  const words = tailTrimmed(leadTrimmed(match[0].split(" "), startsSentence(line, match.index ?? 0)));
  return tooWeak(words) ? undefined : words.join(" ");
}

function namesInLine(line: string): string[] {
  if (/^\s*#/.test(line)) return [];
  return [...line.matchAll(/\b[A-Z][a-z]+(?: [A-Z][a-z]+){0,2}\b/g)].flatMap((m) => nameFrom(line, m) ?? []);
}

export function namesIn(body: string): string[] {
  return plainText(body).split("\n").flatMap(namesInLine);
}

export function mentionedTwice(notes: Note[]): Mention[] {
  const known = knownNames(notes);
  const seen = new Map<string, Set<string>>();
  for (const note of notes) {
    if (!filed(note) || !isSubjectType(note)) continue;
    for (const name of namesIn(note.body)) if (!known.has(name.toLowerCase())) seen.set(name, (seen.get(name) ?? new Set()).add(note.path));
  }
  return [...seen.entries()]
    .filter(([, paths]) => paths.size >= 2)
    .map(([name, paths]) => ({ name, notes: [...paths].sort(), suggest: guessKind(name) }))
    .sort((a, b) => b.notes.length - a.notes.length || a.name.localeCompare(b.name));
}

const isSubjectType = (n: Note) => SUBJECT_TYPES.includes(typeOf(n) ?? "");

export function secondMentions(root: string, text: string, notes = loadAll(root)): Mention[] {
  const known = knownNames(notes);
  const used = new Map<string, Set<string>>();
  for (const note of notes) {
    if (!filed(note) || !isSubjectType(note)) continue;
    for (const name of namesIn(note.body)) if (!known.has(name.toLowerCase())) used.set(name, (used.get(name) ?? new Set()).add(note.path));
  }
  const names = [...new Set(namesIn(text))].filter((x) => !known.has(x.toLowerCase()));
  return names
    .filter((name) => used.has(name))
    .map((name) => ({ name, notes: [...used.get(name)!].sort(), suggest: guessKind(name) }));
}
