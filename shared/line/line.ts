import { formatToken, parseToken, SEP, type Token } from "./tokens.ts";

export interface TodoLine {
  done: boolean;
  text: string;
  tokens: Token[];
}

const TODO = /^- \[( |x|X)\] (.+)$/;

function isToken(token: Token | null): token is Token {
  return token !== null;
}

export function parseTodoLine(line: string): TodoLine | null {
  const match = line.match(TODO);
  if (!match) return null;
  const [text = "", ...parts] = (match[2] ?? "").split(SEP);
  const tokens = parts.map((part) => parseToken(part.trim())).filter(isToken);
  return { done: match[1] !== " ", text: text.trim(), tokens };
}

export function formatTodoLine(todo: TodoLine): string {
  const parts = [todo.text, ...todo.tokens.map(formatToken)];
  return `- [${todo.done ? "x" : " "}] ${parts.join(SEP)}`;
}
