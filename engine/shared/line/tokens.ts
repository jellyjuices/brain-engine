import { parseEvery } from "./every.ts";

export const SEP = " · ";
export const OUTCOMES = ["today", "someday", "waiting"] as const;
export const LINK_KEYS = ["with", "re", "toward"] as const;
export const VALUE_KEYS = [...LINK_KEYS, "due", "every", "done", "about", "from"] as const;
export const BARE_KEYS = [...OUTCOMES, "dropped", "check"] as const;

export type Outcome = (typeof OUTCOMES)[number];
export type LinkKey = (typeof LINK_KEYS)[number];
export type ValueKey = (typeof VALUE_KEYS)[number];
export type BareKey = (typeof BARE_KEYS)[number];
export type KnownToken = { key: ValueKey; value: string } | { key: BareKey };
export type UnknownToken = { raw: string };
export type Token = KnownToken | UnknownToken;

const OLD_OUTCOMES: Record<string, Outcome | null> = {
  "do-now": "today",
  schedule: null,
  park: "someday",
  "hand-off": "waiting",
};
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LINK = /^\[[^\]]*\]\([^)\s]+\)$/;

function isDate(value: string) {
  return ISO_DATE.test(value);
}

function isLink(value: string) {
  return LINK.test(value);
}

function isRule(value: string) {
  return parseEvery(`every ${value}`) !== null;
}

function hasWords(value: string) {
  return value.trim() !== "";
}

const VALID: Record<ValueKey, (value: string) => boolean> = {
  with: isLink,
  re: isLink,
  toward: isLink,
  due: isDate,
  done: isDate,
  every: isRule,
  about: hasWords,
  from: isLink,
};

function isBareKey(word: string): word is BareKey {
  return (BARE_KEYS as readonly string[]).includes(word);
}

function isValueKey(word: string): word is ValueKey {
  return (VALUE_KEYS as readonly string[]).includes(word);
}

export function isOutcome(word: string): word is Outcome {
  return (OUTCOMES as readonly string[]).includes(word);
}

export function toOutcome(word: string | undefined): Outcome | undefined {
  if (!word) return undefined;
  if (isOutcome(word)) return word;
  return Object.hasOwn(OLD_OUTCOMES, word) ? (OLD_OUTCOMES[word] ?? undefined) : undefined;
}

export function parseToken(raw: string): Token | null {
  if (isBareKey(raw)) return { key: raw };
  if (Object.hasOwn(OLD_OUTCOMES, raw)) {
    const outcome = OLD_OUTCOMES[raw];
    return outcome ? { key: outcome } : null;
  }
  const space = raw.indexOf(" ");
  const key = raw.slice(0, space);
  const value = raw.slice(space + 1);
  if (space > 0 && isValueKey(key) && VALID[key](value)) return { key, value };
  return { raw };
}

export function formatToken(token: Token): string {
  if ("raw" in token) return token.raw;
  return "value" in token ? `${token.key} ${token.value}` : token.key;
}
