import { formatToken, LOOPS_HEADING, OLD_LOOPS_HEADING, parseTodoLine, parseToken, SEP } from "../../shared/line/index.ts";

export interface BodyChange {
  kind: "heading" | "token";
  what: string;
}

export interface BodyResult {
  body: string;
  changes: BodyChange[];
  undated: number[];
  outside: number[];
  bothHeadings: boolean;
}

type Mark = { drop: true } | { drop: false; to: string } | undefined;

function markOf(word: string): Mark {
  if (word === "parked") return { drop: false, to: "someday" };
  const token = parseToken(word);
  if (token === null || ("key" in token && token.key === "today")) return { drop: true };
  const to = formatToken(token);
  return to === word ? undefined : { drop: false, to };
}

const isDue = (part: string) => {
  const token = parseToken(part.trim());
  return !!token && "key" in token && token.key === "due";
};

function migrateTodo(line: string): { line: string; changes: BodyChange[]; undated: boolean } {
  const todo = parseTodoLine(line);
  if (!todo) return { line, changes: [], undated: false };
  const prefix = line.slice(0, 6);
  const [text = "", ...parts] = line.slice(6).split(SEP);
  const words = parts.map((p) => p.trim());
  const kept: string[] = [];
  const changes: BodyChange[] = [];
  let dropped = false;
  for (const part of parts) {
    const word = part.trim();
    const mark = markOf(word);
    if (!mark) kept.push(part);
    else if (mark.drop) {
      dropped = true;
      changes.push({ kind: "token", what: `· ${word} removed` });
    } else {
      changes.push({ kind: "token", what: `· ${word} → · ${mark.to}` });
      if (!words.includes(mark.to) && !kept.includes(mark.to)) kept.push(mark.to);
    }
  }
  if (!changes.length) return { line, changes, undated: false };
  return { line: prefix + [text, ...kept].join(SEP), changes, undated: dropped && !todo.done && !parts.some(isDue) };
}

const hasOldMark = (line: string) => {
  const todo = parseTodoLine(line);
  if (!todo) return false;
  return line.split(SEP).slice(1).some((p) => p.trim() !== "parked" && markOf(p.trim()) !== undefined);
};

export function migrateBody(body: string, firstLine = 1): BodyResult {
  const lines = body.split("\n");
  const hasNew = lines.some((l) => l.trim() === LOOPS_HEADING);
  const result: BodyResult = { body, changes: [], undated: [], outside: [], bothHeadings: false };
  let inTodos = false;
  lines.forEach((line, i) => {
    if (line.startsWith("# ")) {
      inTodos = line.trim() === LOOPS_HEADING || line.trim() === OLD_LOOPS_HEADING;
      if (line.trim() !== OLD_LOOPS_HEADING) return;
      if (hasNew) result.bothHeadings = true;
      else {
        lines[i] = LOOPS_HEADING;
        result.changes.push({ kind: "heading", what: `${OLD_LOOPS_HEADING} → ${LOOPS_HEADING}` });
      }
      return;
    }
    if (!inTodos) {
      if (hasOldMark(line)) result.outside.push(i + firstLine);
      return;
    }
    const todo = migrateTodo(line);
    if (!todo.changes.length) return;
    lines[i] = todo.line;
    result.changes.push(...todo.changes.map((c) => ({ ...c, what: `line ${i + firstLine}: ${c.what}` })));
    if (todo.undated) result.undated.push(i + firstLine);
  });
  result.body = lines.join("\n");
  return result;
}
