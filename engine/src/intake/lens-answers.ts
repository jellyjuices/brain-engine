import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { addSubjectFact } from "./subjects.ts";
import { linkKnownNames } from "./intake-end.ts";
import { type Note, nowStamp, today } from "../core/notes.ts";
import { loadAll, readNote, writeAtomic, writeNote } from "../core/files.ts";
import { log } from "../core/log.ts";
import { ensureLens, LENSES, lensPath, lensPrivacy, needLens } from "./lenses.ts";

export interface SaveOptions {
  session?: number;
  by?: string;
  /** One short exact phrase from the owner, kept only when the wording matters. */
  quote?: string;
  /** the owner's full answer, word for word. Kept in sources/intake/, never in the lens note. Full lenses only. */
  raw?: string;
  /** The question that was asked. Saved with the raw answer. */
  question?: string;
  /** Link the first mention of each known subject in the line. Default true. */
  link?: boolean;
  /** Facts about a subject go to its note, not the lens. Each is a dated note line there. */
  facts?: { into: string; text: string }[];
}

export const QUOTE_MAX = 120;
export const rawPath = (date: string, session?: number) => `sources/intake/${date}${session ? `-session-${session}` : ""}.md`;

/** Append the owner's full answer to the session file in sources/intake/. Returns its path. */
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

/**
 * Save one answer. The lens note gets the distilled line the owner approved (plus an optional short quote).
 * The full answer, when given, goes to sources/intake/ and the line links to it.
 */
export function saveLensAnswer(root: string, slug: string, text: string, opts: SaveOptions = {}): Note {
  needLens(slug);
  const privacy = lensPrivacy(root, slug);
  if (privacy === "skip") throw new Error(`You set the ${slug} lens to skip. Nothing was saved.`);
  if (privacy === "headline" && (opts.raw || opts.quote)) throw new Error(`The ${slug} lens is set to headline: save one short line only, with no quote or raw answer.`);
  const quote = opts.quote?.trim().replace(/^["“]|["”]$/g, "").replace(/\s*\n\s*/g, " ");
  if (quote && quote.length > QUOTE_MAX) throw new Error(`The quote is over ${QUOTE_MAX} characters. Keep only the phrase that matters.`);
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
  const note = writeNote(root, rel, { ...n.meta, generated: { by: opts.by ?? "claude", at: nowStamp() } }, body);
  log(root, `intake answer saved to ${rel}${raw ? ` (raw in ${raw})` : ""}`);
  for (const f of opts.facts ?? []) addSubjectFact(root, f.into, f.text);
  return note;
}

export interface RedactResult {
  lensLines: number;
  rawAnswers: number;
  threads: number;
  files: string[];
}

/**
 * the owner asked to take something back. Remove every intake line, quote and thread that holds the words,
 * and blank the matching raw answers in sources/intake/. This is the one place the intake removes text.
 */
export function redact(root: string, words: string, by = "claude"): RedactResult {
  const needle = words.trim().toLowerCase();
  if (needle.length < 3) throw new Error("Give at least 3 characters to redact.");
  const has = (t: string) => t.toLowerCase().includes(needle);
  const out: RedactResult = { lensLines: 0, rawAnswers: 0, threads: 0, files: [] };
  for (const lens of LENSES) {
    const rel = lensPath(lens.slug);
    if (!existsSync(join(root, rel))) continue;
    const note = readNote(root, rel);
    const lines = note.body.split("\n");
    const keep: string[] = [];
    let dropping = false;
    for (const line of lines) {
      if (line.startsWith("- ")) dropping = has(line);
      else if (!line.startsWith("  - ")) dropping = false;
      const subHit = line.startsWith("  - ") && has(line);
      if (dropping || subHit) {
        if (/^- \[[ xX]\] /.test(line)) out.threads++;
        else out.lensLines++;
        continue;
      }
      keep.push(line);
    }
    if (keep.length !== lines.length) {
      writeNote(root, rel, { ...note.meta, generated: { by, at: nowStamp() } }, keep.join("\n"));
      out.files.push(rel);
    }
  }
  const rawDir = join(root, "sources", "intake");
  if (existsSync(rawDir)) {
    for (const f of readdirSync(rawDir).filter((x) => x.endsWith(".md"))) {
      const full = join(rawDir, f);
      const text = readFileSync(full, "utf8");
      let count = 0;
      const next = text.replace(/^\*\*(Q|A):\*\* .*$/gm, (m, k: string) => {
        if (!has(m)) return m;
        count++;
        return `**${k}:** [redacted at the owner's request]`;
      });
      if (count) {
        writeAtomic(full, next);
        out.rawAnswers += count;
        out.files.push(`sources/intake/${f}`);
      }
    }
  }
  log(root, `redacted at the owner's request: ${out.lensLines} lens lines, ${out.rawAnswers} raw answers, ${out.threads} threads`);
  return out;
}

export function intakeBlocks(n: Note): string[] {
  return [...n.body.matchAll(/^## (\d{4}-\d{2}-\d{2}.*)$/gm)].map((m) => m[1]);
}
