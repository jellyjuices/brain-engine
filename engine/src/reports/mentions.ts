import { posix } from "node:path";
import { DIRS, folderOf, type Note, titleOf, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { SUBJECT_TYPES } from "./card.ts";
import { guessKind, lowerWords, namesIn, plainText, withoutSplitTails } from "./names.ts";

export { guessKind, namesIn };

export const MAX_WARN_LINES = 10;
const MENTION_TYPES = ["Person", "Group", "Place", "Thing", "Topic", "Project"];
const filed = (n: Note) => folderOf(n) !== "inbox" && folderOf(n) !== DIRS.archive && folderOf(n) !== "journal";

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

const isSubjectType = (n: Note) => SUBJECT_TYPES.includes(typeOf(n) ?? "");

interface Seen {
  paths: Set<string>;
  text: string;
}

function collectNames(notes: Note[]): Map<string, Seen> {
  const known = knownNames(notes);
  const lower = lowerWords(notes.map((n) => n.body));
  const seen = new Map<string, Seen>();
  for (const note of notes) {
    if (!filed(note) || !isSubjectType(note)) continue;
    const names = namesIn(note.body, lower).filter((name) => !known.has(name.toLowerCase()));
    for (const name of withoutSplitTails(names)) {
      const entry = seen.get(name) ?? { paths: new Set<string>(), text: "" };
      if (!entry.paths.has(note.path)) entry.text += `\n${plainText(note.body)}`;
      entry.paths.add(note.path);
      seen.set(name, entry);
    }
  }
  return seen;
}

const mention = (name: string, seen: Seen, extra = ""): Mention => ({ name, notes: [...seen.paths].sort(), suggest: guessKind(name, seen.text + extra) });

export function mentionedTwice(notes: Note[]): Mention[] {
  return [...collectNames(notes).entries()]
    .filter(([, seen]) => seen.paths.size >= 2)
    .map(([name, seen]) => mention(name, seen))
    .sort((a, b) => b.notes.length - a.notes.length || a.name.localeCompare(b.name));
}

export function secondMentions(root: string, text: string, notes = loadAll(root)): Mention[] {
  const used = collectNames(notes);
  const known = knownNames(notes);
  const lower = lowerWords(notes.map((n) => n.body));
  const names = withoutSplitTails([...new Set(namesIn(text, lower))]).filter((x) => !known.has(x.toLowerCase()));
  return names.filter((name) => used.has(name)).map((name) => mention(name, used.get(name)!, `\n${text}`));
}
