import { formatTodoLine, type TodoLine } from "./line.ts";
import { isOutcome, SEP, type BareKey, type KnownToken, type LinkKey, type Outcome, type Token, type ValueKey } from "./tokens.ts";

export interface TodoFields {
  text: string;
  done: boolean;
  due?: string;
  doneAt?: string;
  every?: string;
  outcome?: Outcome;
  dropped?: boolean;
  check?: boolean;
  about?: string;
  from?: string;
  with?: string[];
  re?: string[];
  toward?: string[];
  unknown?: string[];
}

export type TodoPatch = Partial<Omit<TodoFields, "unknown">>;
type PatchKey = Exclude<keyof TodoPatch, "text" | "done">;

const RANKED: PatchKey[] = ["with", "re", "toward", "due", "every", "outcome", "doneAt", "dropped"];
const PATCH_ORDER: PatchKey[] = [...RANKED, "about", "check", "from"];

type ValueSetter = (fields: TodoFields, value: string) => void;

const pushLink =
  (key: LinkKey): ValueSetter =>
  (fields, value) => {
    (fields[key] ??= []).push(value);
  };

const VALUE_SETTERS: Record<ValueKey, ValueSetter> = {
  with: pushLink("with"),
  re: pushLink("re"),
  toward: pushLink("toward"),
  due: (f, v) => (f.due = v),
  every: (f, v) => (f.every = v),
  about: (f, v) => (f.about = v),
  from: (f, v) => (f.from = v),
  done: (f, v) => (f.doneAt = v),
};

function addBare(fields: TodoFields, key: BareKey): void {
  if (key === "dropped" || key === "check") fields[key] = true;
  else fields.outcome = key;
}

function addField(fields: TodoFields, token: Token): void {
  if ("raw" in token) (fields.unknown ??= []).push(token.raw);
  else if ("value" in token) VALUE_SETTERS[token.key](fields, token.value);
  else addBare(fields, token.key);
}

export function fieldsOf(todo: TodoLine): TodoFields {
  const fields: TodoFields = { text: todo.text, done: todo.done };
  for (const token of todo.tokens) addField(fields, token);
  return fields;
}

function tokenKey(key: PatchKey): KnownToken["key"] | null {
  if (key === "doneAt") return "done";
  return key === "outcome" ? null : key;
}

function matchesKey(key: PatchKey, token: Token): boolean {
  if ("raw" in token) return false;
  return key === "outcome" ? isOutcome(token.key) : token.key === tokenKey(key);
}

function tokensFor(key: PatchKey, patch: TodoPatch): Token[] {
  if (key === "with" || key === "re" || key === "toward") {
    const linkKey: LinkKey = key;
    return (patch[key] ?? []).map((value) => ({ key: linkKey, value }));
  }
  if (key === "dropped" || key === "check") return patch[key] ? [{ key }] : [];
  if (key === "outcome") return patch.outcome ? [{ key: patch.outcome }] : [];
  const value = patch[key];
  return value ? [{ key: key === "doneAt" ? "done" : key, value }] : [];
}

function rank(token: Token): number {
  if ("raw" in token) return -1;
  return RANKED.findIndex((key) => matchesKey(key, token));
}

function insertAt(tokens: Token[], key: PatchKey): number {
  const own = RANKED.indexOf(key);
  const later = own === -1 ? -1 : tokens.findIndex((token) => rank(token) > own);
  return later === -1 ? tokens.length : later;
}

function replaceTokens(tokens: Token[], key: PatchKey, next: Token[]): Token[] {
  const found = tokens.findIndex((token) => matchesKey(key, token));
  const kept = tokens.filter((token) => !matchesKey(key, token));
  const at = found === -1 ? insertAt(kept, key) : found;
  return [...kept.slice(0, at), ...next, ...kept.slice(at)];
}

export function tidyText(text: string): string {
  return text.replace(/\s*\n\s*/g, " ").replaceAll(SEP, " - ").trim();
}

export function updateTodo(todo: TodoLine, patch: TodoPatch): TodoLine {
  let tokens = todo.tokens;
  for (const key of PATCH_ORDER) {
    if (Object.hasOwn(patch, key)) tokens = replaceTokens(tokens, key, tokensFor(key, patch));
  }
  return {
    done: patch.done ?? todo.done,
    text: patch.text === undefined ? todo.text : tidyText(patch.text),
    tokens,
  };
}

export function newTodoLine(patch: TodoPatch & { text: string }): string {
  return formatTodoLine(updateTodo({ done: false, text: "", tokens: [] }, patch));
}

export function tickTodo(todo: TodoLine, date: string): TodoLine {
  return updateTodo(todo, { done: true, every: undefined, doneAt: date });
}

export function dropTodo(todo: TodoLine, date: string): TodoLine {
  return updateTodo(todo, { done: true, every: undefined, doneAt: date, dropped: true });
}
