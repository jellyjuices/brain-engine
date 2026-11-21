import { existsSync } from "node:fs";
import { join } from "node:path";
import { type Note, nowStamp, type Summary, today } from "../core/notes.ts";
import { readNote, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { ensureLens, LENSES, lensPath, lensPrivacy, needLens, PRIVACY, THREAD_STATUS, THREADS_HEADING } from "./lenses.ts";

const TSEP = " · ";

export interface ThreadInput {
  question: string;
  lens: string;
  depth?: number;
  star?: boolean;
  by?: string;
  area?: string;
  from?: string;
  privacy?: string;
}

export interface ThreadSummary extends Summary {
  question: string;
  lens: string;
  depth: number;
  starred: boolean;
  created?: string;
  from?: string;
}

function threadRange(lines: string[]): [number, number] | null {
  const headingIndex = lines.findIndex((l) => l.trim() === THREADS_HEADING);
  if (headingIndex === -1) return null;
  let end = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) if (/^# /.test(lines[i])) { end = i; break; }
  return [headingIndex + 1, end];
}

function parseThreadLine(line: string, lens: string): Omit<ThreadSummary, "path" | "modified" | "tags" | "type" | "title" | "description"> | null {
  const match = line.match(/^- \[( |x|X)\] (.+)$/);
  if (!match) return null;
  const [question, ...tokens] = match[2].split(TSEP);
  let status: string = match[1] === " " ? "open" : "closed";
  let starred = false, depth = 1, created: string | undefined;
  for (const t of tokens.map((x) => x.trim())) {
    if (t === "★") starred = true;
    else if (/^depth \d+$/.test(t)) depth = Number(t.slice(6));
    else if (/^\d{4}-\d{2}-\d{2}$/.test(t)) created = t;
    else if ((THREAD_STATUS as readonly string[]).includes(t)) status = t;
  }
  return { question: question.trim(), lens, depth, starred, created, status };
}

function formatThread(t: { question: string; status?: string; starred?: boolean; depth?: number; created?: string }): string {
  const oneLine = t.question.replace(/\s*\n\s*/g, " ").replaceAll(TSEP, " - ").trim();
  const status = t.status ?? "open";
  const tokens = [
    t.starred && "★",
    status !== "open" && status !== "closed" && status,
    status === "closed" && "closed",
    (t.depth ?? 1) > 1 && `depth ${t.depth}`,
    t.created,
  ].filter(Boolean);
  return `- [${status === "open" || status === "parked" ? " " : "x"}] ${[oneLine, ...tokens].join(TSEP)}`;
}

function threadsInLens(root: string, slug: string): { note?: Note; items: (ThreadSummary & { line: number })[] } {
  const rel = lensPath(slug);
  if (!existsSync(join(root, rel))) return { items: [] };
  const note = readNote(root, rel);
  const lines = note.body.split("\n");
  const range = threadRange(lines);
  const items: (ThreadSummary & { line: number })[] = [];
  if (range) {
    for (let i = range[0]; i < range[1]; i++) {
      const thread = parseThreadLine(lines[i], slug);
      if (thread) items.push({ ...thread, line: i, path: rel, type: "Thread", title: thread.question, description: `${slug} · depth ${thread.depth}${thread.starred ? " · ★" : ""}`, tags: [], modified: thread.created ?? today() });
    }
  }
  return { note: note, items };
}

export function addThread(root: string, t: ThreadInput): ThreadSummary {
  const question = t.question.trim().replace(/\s*\n\s*/g, " ");
  if (!question) throw new Error("A thread needs a question.");
  needLens(t.lens);
  const privacy = t.privacy ?? lensPrivacy(root, t.lens);
  if (!(PRIVACY as readonly string[]).includes(privacy)) throw new Error(`privacy must be one of: ${PRIVACY.join(", ")}`);
  if (privacy === "skip" || lensPrivacy(root, t.lens) === "skip") throw new Error(`You set the ${t.lens} lens to skip. No thread was saved.`);
  const rel = ensureLens(root, t.lens, t.by);
  const note = readNote(root, rel);
  const existing = threadsInLens(root, t.lens).items.find((x) => x.question.toLowerCase() === question.toLowerCase());
  if (existing) return existing;
  const line = formatThread({ question, starred: t.star, depth: t.depth ?? 1, created: today() });
  const lines = note.body.replace(/\s+$/, "").split("\n");
  let range = threadRange(lines);
  if (!range) {
    lines.push("", THREADS_HEADING, "");
    range = [lines.length, lines.length];
  }
  for (let i = range[1] - 1; i >= range[0]; i--) if (/^Run `brain thread list/.test(lines[i])) { lines.splice(i, 1); range[1]--; }
  let at = range[1];
  while (at > range[0] && lines[at - 1].trim() === "") at--;
  lines.splice(at, 0, ...(at === range[0] ? ["", line] : [line]));
  writeNote(root, rel, { ...note.meta, generated: { by: t.by ?? "claude", at: nowStamp() } }, lines.join("\n"));
  log(root, `thread added to ${rel}: ${question}`);
  return threadsInLens(root, t.lens).items.find((x) => x.question === question)!;
}

export function listThreads(root: string, f: { status?: string; lens?: string; area?: string } = {}): ThreadSummary[] {
  return LENSES.filter((l) => !f.lens || l.slug === f.lens)
    .flatMap((l) => threadsInLens(root, l.slug).items)
    .filter((t) => !f.status || t.status === f.status)
    .map(({ line: _line, ...t }) => t)
    .sort(rankThreads);
}

function rankThreads(a: ThreadSummary, b: ThreadSummary): number {
  return Number(b.starred) - Number(a.starred) || a.depth - b.depth || (a.created ?? "").localeCompare(b.created ?? "") || a.question.localeCompare(b.question);
}

export function nextThread(root: string, f: { lens?: string } = {}): ThreadSummary | undefined {
  return listThreads(root, { status: "open", lens: f.lens })[0];
}

export function updateThread(root: string, query: string, ch: { status?: string; star?: boolean; by?: string }): ThreadSummary {
  if (ch.status && !(THREAD_STATUS as readonly string[]).includes(ch.status)) throw new Error(`status must be one of: ${THREAD_STATUS.join(", ")}`);
  const needle = query.toLowerCase().trim();
  const all = LENSES.flatMap((l) => threadsInLens(root, l.slug).items);
  const hits = all.filter((t) => t.question.toLowerCase() === needle || t.question.toLowerCase().includes(needle) || t.path.toLowerCase() === needle);
  if (!hits.length) throw new Error(`No thread matches "${query}".`);
  const hit = hits[0];
  const note = readNote(root, hit.path);
  const lines = note.body.split("\n");
  const next = { ...hit, status: ch.status ?? hit.status, starred: ch.star ?? hit.starred };
  lines[hit.line] = formatThread(next);
  writeNote(root, hit.path, { ...note.meta, generated: { by: ch.by ?? "claude", at: nowStamp() } }, lines.join("\n"));
  log(root, `thread "${hit.question}"${ch.status ? ` is ${ch.status}` : ""}${ch.star === true ? " starred" : ch.star === false ? " unstarred" : ""}`);
  const { line: _l, ...rest } = next;
  return rest;
}
