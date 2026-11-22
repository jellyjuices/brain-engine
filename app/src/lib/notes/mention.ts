import { quickChoices } from "./due.ts";
import { referenceText } from "./insert.ts";
import { isLive, type StoredNote } from "./model.ts";
import { SUBJECT_TYPES } from "./types.ts";

export type TriggerKind = "mention" | "tag";

export interface Trigger {
  kind: TriggerKind;
  start: number;
  query: string;
}

export interface Suggestion {
  key: string;
  kind: "subject" | "date" | "tag";
  type?: string;
  title: string;
  sub?: string;
  value: string;
}

const REACH = 40;
const LIMIT = 6;
const TAG_QUERY = /^[\w-]*$/;
const MENTION_QUERY = /^(?! )(?!.* {2})[^\n@#]*$/;

export function findTrigger(value: string, caret: number): Trigger | null {
  for (let i = caret - 1; i >= Math.max(0, caret - REACH); i--) {
    const ch = value[i];
    if (ch === "\n") return null;
    if (ch !== "@" && ch !== "#") continue;
    const prev = value[i - 1];
    if (prev !== undefined && !/\s/.test(prev)) return null;
    const query = value.slice(i + 1, caret);
    const kind: TriggerKind = ch === "@" ? "mention" : "tag";
    const fits = kind === "tag" ? TAG_QUERY : MENTION_QUERY;
    return fits.test(query) ? { kind, start: i, query } : null;
  }
  return null;
}

function matches(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function startsFirst(query: string) {
  const q = query.toLowerCase();
  return (a: string, b: string) =>
    Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)) ||
    a.localeCompare(b);
}

export function mentionSuggestions(
  notes: StoredNote[],
  from: string,
  now: string,
  query: string,
): Suggestion[] {
  const order = startsFirst(query);
  const subjects: Suggestion[] = notes
    .filter(
      (n) =>
        SUBJECT_TYPES.includes(n.type ?? "") &&
        isLive(n) &&
        n.path !== from &&
        matches(n.title, query),
    )
    .sort((a, b) => order(a.title, b.title))
    .slice(0, LIMIT)
    .map((n) => ({
      key: n.path,
      kind: "subject",
      type: n.type,
      title: n.title,
      sub: n.type,
      value: referenceText(from, n).text,
    }));
  return [...subjects, ...dateSuggestions(now, query)].slice(0, LIMIT);
}

export function dateSuggestions(now: string, query = ""): Suggestion[] {
  return quickChoices(now, ["today", "tomorrow", "friday", "nextWeek"])
    .filter((c) => matches(c.label, query))
    .map((c) => {
      const iso = c.value === "today" ? now : c.value;
      return { key: `date:${c.id}`, kind: "date", title: c.label, sub: c.sub, value: iso };
    });
}

export function tagSuggestions(known: string[], taken: string[], query: string): Suggestion[] {
  return known
    .filter((t) => !taken.includes(t) && matches(t, query))
    .sort(startsFirst(query))
    .slice(0, LIMIT)
    .map((t) => ({ key: `tag:${t}`, kind: "tag", title: `#${t}`, value: t }));
}

export function replaceTrigger(value: string, trigger: Trigger, caret: number, text: string) {
  const before = value.slice(0, trigger.start);
  const rest = value.slice(caret);
  const after = !text && /\s$/.test(before) && rest.startsWith(" ") ? rest.slice(1) : rest;
  const gap = text && !/^\s/.test(after) ? " " : "";
  const add = text + gap;
  return { value: before + add + after, caret: before.length + add.length };
}
