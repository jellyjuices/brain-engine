import { formatTodoLine, type TodoLine } from "./line.ts";
import { isOutcome, SEP, type KnownToken, type LinkKey, type Outcome, type Token } from "./tokens.ts";

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

function addField(fields: TodoFields, token: Token): void {
  if ("raw" in token) {
    (fields.unknown ??= []).push(token.raw);
    return;
  }
  switch (token.key) {
    case "with":
    case "re":
    case "toward":
      (fields[token.key] ??= []).push(token.value);
      return;
    case "due":
    case "every":
    case "about":
    case "from":
      fields[token.key] = token.value;
      return;
    case "done":
      fields.doneAt = token.value;
      return;
    case "dropped":
    case "check":
      fields[token.key] = true;
      return;
    default:
      fields.outcome = token.key;
  }
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
