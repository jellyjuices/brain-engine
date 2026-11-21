import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { addSubjectFact } from "./subjects.ts";
import { linkKnownNames } from "./intake-end.ts";
import { type Note, nowStamp, today } from "../core/notes.ts";
import { loadAll, readNote, writeAtomic, writeNote } from "../core/files.ts";
import { changeFiles, log } from "../core/log.ts";
import { ensureLens, LENSES, lensPath, lensPrivacy, needLens } from "./lenses.ts";
import { updateThread } from "./threads.ts";

export interface SaveOptions {
  session?: number;
  by?: string;
  quote?: string;
  raw?: string;
  question?: string;
  link?: boolean;
  facts?: { into: string; text: string }[];
  thread?: string;
}

export const QUOTE_MAX = 120;
export const rawPath = (date: string, session?: number) => `sources/intake/${date}${session ? `-session-${session}` : ""}.md`;

export function saveRaw(root: string, slug: string, raw: string, opts: { session?: number; question?: string } = {}): string {
  const rel = rawPath(today(), opts.session);
  const full = join(root, rel);
  const head = existsSync(full)
    ? readFileSync(full, "utf8").trimEnd()
    : `# Intake ${today()}${opts.session ? ` session ${opts.session}` : ""}\n\nThe owner's answers, word for word. Written by \`brain intake save --raw\`. Do not edit.`;
  const time = nowStamp().slice(11, 16);
  const parts = [`## ${time} · ${slug}`, ""];
  if (opts.question?.trim()) parts.push(`**Q:** ${opts.question.trim()}`, "");
  parts.push(`**A:** ${raw.trim()}`);
  writeAtomic(full, `${head}\n\n${parts.join("\n")}\n`);
  return rel;
}

export function saveLensAnswer(root: string, slug: string, text: string, opts: SaveOptions = {}): Note {
  needLens(slug);
  const privacy = lensPrivacy(root, slug);
  if (privacy === "skip") throw new Error(`You set the ${slug} lens to skip. Nothing was saved.`);
  if (privacy === "headline" && (opts.raw || opts.quote)) throw new Error(`The ${slug} lens is set to headline: save one short line only, with no quote or raw answer.`);
  const quote = opts.quote?.trim().replace(/^["“]|["”]$/g, "").replace(/\s*\n\s*/g, " ");
  if (quote && quote.length > QUOTE_MAX) throw new Error(`The quote is over ${QUOTE_MAX} characters. Keep only the phrase that matters.`);
  const rawRel = opts.raw?.trim() ? rawPath(today(), opts.session) : undefined;
  const lensPaths = opts.thread ? LENSES.map((l) => lensPath(l.slug)) : [lensPath(slug)];
  const paths = [...lensPaths, ...(rawRel ? [rawRel] : [])];
  const msg = `intake: answer saved to ${lensPath(slug)}${rawRel ? ` (raw in ${rawRel})` : ""}`;
  const note = changeFiles(root, paths, msg, () => {
    const saved = writeLensLine(root, slug, text, quote, opts);
    if (opts.thread) updateThread(root, opts.thread, { status: "talked", by: opts.by });
    return saved;
  });
  for (const f of opts.facts ?? []) addSubjectFact(root, f.into, f.text);
  return note;
}

function writeLensLine(root: string, slug: string, text: string, quote: string | undefined, opts: SaveOptions): Note {
  const raw = opts.raw?.trim() ? saveRaw(root, slug, opts.raw, { session: opts.session, question: opts.question }) : undefined;
  const rel = ensureLens(root, slug, opts.by);
  const n = readNote(root, rel);
  const heading = `## ${today()}${opts.session ? ` session ${opts.session}` : ""}`;
  let body = n.body.trimEnd();
  if (!/^# Intake log\s*$/m.test(body)) body += "\n\n# Intake log";
  const lastH2 = [...body.matchAll(/^## .*$/gm)].at(-1)?.[0];
  const flat = text.trim().replace(/\s*\n\s*/g, " ");
  let line = `- ${opts.link === false ? flat : linkKnownNames(loadAll(root), flat, rel)}`;
  if (raw) line += ` ([raw](../${raw}))`;
  if (quote) line += `\n  - In their words: "${quote}"`;
  body = lastH2 === heading ? `${body}\n${line}` : `${body}\n\n${heading}\n\n${line}`;
  return writeNote(root, rel, { ...n.meta, generated: { by: opts.by ?? "claude", at: nowStamp() } }, body);
}

export interface RedactResult {
  lensLines: number;
  rawAnswers: number;
  threads: number;
  files: string[];
}

export function redact(root: string, words: string, by = "claude"): RedactResult {
  const needle = words.trim().toLowerCase();
  if (needle.length < 3) throw new Error("Give at least 3 characters to redact.");
  const has = (t: string) => t.toLowerCase().includes(needle);
  const out: RedactResult = { lensLines: 0, rawAnswers: 0, threads: 0, files: [] };
  for (const lens of LENSES) redactLens(root, lensPath(lens.slug), has, by, out);
  redactRaw(root, has, out);
  log(root, `redacted at the owner's request: ${out.lensLines} lens lines, ${out.rawAnswers} raw answers, ${out.threads} threads`);
  return out;
}

type Has = (t: string) => boolean;

function nextDropping(line: string, dropping: boolean, has: Has): boolean {
  if (line.startsWith("- ")) return has(line);
  return line.startsWith("  - ") ? dropping : false;
}

function countDropped(line: string, out: RedactResult) {
  if (/^- \[[ xX]\] /.test(line)) out.threads++;
  else out.lensLines++;
}

function keptLines(lines: string[], has: Has, out: RedactResult): string[] {
  const keep: string[] = [];
  let dropping = false;
  for (const line of lines) {
    dropping = nextDropping(line, dropping, has);
    const subHit = line.startsWith("  - ") && has(line);
    if (dropping || subHit) countDropped(line, out);
    else keep.push(line);
  }
  return keep;
}

function redactLens(root: string, rel: string, has: Has, by: string, out: RedactResult) {
  if (!existsSync(join(root, rel))) return;
  const note = readNote(root, rel);
  const lines = note.body.split("\n");
  const keep = keptLines(lines, has, out);
  if (keep.length === lines.length) return;
  writeNote(root, rel, { ...note.meta, generated: { by, at: nowStamp() } }, keep.join("\n"));
  out.files.push(rel);
}

function redactRawFile(full: string, has: Has): number {
  let count = 0;
  const next = readFileSync(full, "utf8").replace(/^\*\*(Q|A):\*\* .*$/gm, (m, k: string) => {
    if (!has(m)) return m;
    count++;
    return `**${k}:** [redacted at the owner's request]`;
  });
  if (count) writeAtomic(full, next);
  return count;
}

function redactRaw(root: string, has: Has, out: RedactResult) {
  const rawDir = join(root, "sources", "intake");
  if (!existsSync(rawDir)) return;
  for (const f of readdirSync(rawDir).filter((x) => x.endsWith(".md"))) {
    const count = redactRawFile(join(rawDir, f), has);
    if (!count) continue;
    out.rawAnswers += count;
    out.files.push(`sources/intake/${f}`);
  }
}

export function intakeBlocks(n: Note): string[] {
  return [...n.body.matchAll(/^## (\d{4}-\d{2}-\d{2}.*)$/gm)].map((m) => m[1]);
}
