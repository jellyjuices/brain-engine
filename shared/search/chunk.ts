import { parseTodoLine, SEP, type TodoLine } from "../line/index.ts";
import { toEntries, type Draft } from "./entry.ts";
import { readHead } from "./note.ts";
import { plainLine, plainText } from "./plain.ts";
import { splitSection, type SectionLine } from "./section.ts";
import type { Entry, NoteHead } from "./types.ts";

const HEADING = /^#{1,6}\s+(.*)$/;
const DATED = /^\s*[-*]\s+(\d{4}-\d{2}-\d{2})\s+·\s+(.*)$/;
const FENCE = /^\s*(```|~~~)/;

interface Section {
  heading: string;
  line: number;
  body: SectionLine[];
}

function tokenValue(todo: TodoLine, key: string): string | null {
  const token = todo.tokens.find((item) => "key" in item && item.key === key);
  return token && "value" in token ? token.value : null;
}

function todoDraft(todo: TodoLine, raw: string, line: number, head: NoteHead): Draft {
  const date = tokenValue(todo, "done") ?? tokenValue(todo, "due") ?? head.date;
  return { kind: "todo", key: todo.text, date, done: todo.done, line, text: raw.trim(), embedText: plainLine(todo.text) };
}

function datedDraft(date: string, rest: string, raw: string, line: number): Draft {
  const words = rest.split(SEP)[0] ?? "";
  return { kind: "dated", key: `${date}${SEP}${words}`, date, done: null, line, text: raw.trim(), embedText: plainLine(words) };
}

function cardDraft(head: NoteHead): Draft {
  const text = head.description ? `${head.title}\n${head.description}` : head.title;
  return { kind: "card", key: "", date: head.date, done: null, line: 1, text, embedText: plainText(text.split("\n")) };
}

function sectionDrafts(section: Section, head: NoteHead): Draft[] {
  const heading = plainLine(section.heading);
  return splitSection(section.body).map((part, index) => {
    const text = [section.heading, ...part.map((item) => item.raw)].filter((line) => line !== "").join("\n");
    const body = plainText(part.map((item) => item.raw));
    const embedText = heading ? `${heading}\n${body}` : body;
    const line = index === 0 && section.heading ? section.line : (part[0]?.line ?? section.line);
    return { kind: "section", key: `${heading}${SEP}${index}`, date: head.date, done: null, line, text, embedText };
  });
}

export function chunkNote(path: string, source: string): Entry[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const head = readHead(path, lines);
  const drafts: Draft[] = [cardDraft(head)];
  const sections: Section[] = [];
  let section: Section = { heading: "", line: head.bodyStart + 1, body: [] };
  let fenced = false;
  lines.slice(head.bodyStart).forEach((raw, offset) => {
    const line = head.bodyStart + offset + 1;
    if (FENCE.test(raw)) fenced = !fenced;
    const heading = fenced ? null : raw.match(HEADING);
    if (heading) {
      sections.push(section);
      section = { heading: raw.trim(), line, body: [] };
      return;
    }
    const todo = fenced ? null : parseTodoLine(raw.trim());
    const dated = fenced || todo ? null : raw.match(DATED);
    if (todo) drafts.push(todoDraft(todo, raw, line, head));
    else if (dated) drafts.push(datedDraft(dated[1] ?? "", dated[2] ?? "", raw, line));
    else section.body.push({ raw, line });
  });
  sections.push(section);
  const [card, ...rest] = [...drafts, ...sections.flatMap((item) => sectionDrafts(item, head))];
  const ordered = rest.sort((a, b) => a.line - b.line);
  return toEntries(path, head, card ? [card, ...ordered] : ordered);
}
