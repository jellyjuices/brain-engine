// One-time move to the roll-up layout (run once, 2026-11-05):
//   1. Threads: threads/*.md become checklist lines in their lens note. The thread files are removed.
//   2. Labels: drop `generated` when the owner wrote it, one time stamp (`created`), no client_id from local adds,
//      no self-`verified`, no capture title that only repeats the text. Lists are written on one line.
// It never touches note text, only labels, and it prints what it changed.
// Run: node --disable-warning=ExperimentalWarning scripts/migrations/2026-11-05-roll-up.ts [--dry-run]

import { existsSync, readdirSync, rmdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { appendToSection } from "../src/todos/loops.ts";
import { isOwnerWriter } from "../src/core/owner.ts";
import { ensureLens, formatThread, LENSES, THREADS_HEADING } from "../src/intake/lenses.ts";
import { brainHome, loadAll, log, parse, readNote, str, writeNote, type Meta } from "../src/core/notes.ts";
import { readFileSync } from "node:fs";

const root = brainHome();
const dry = process.argv.includes("--dry-run");
const say = (s: string) => process.stdout.write(s + "\n");

// ---- 1. threads ----------------------------------------------------------
const tdir = join(root, "threads");
let moved = 0;
if (existsSync(tdir)) {
  const files = readdirSync(tdir).filter((f) => f.endsWith(".md"));
  const byLens = new Map<string, string[]>();
  for (const f of files) {
    const { meta, body } = parse(readFileSync(join(tdir, f), "utf8"));
    const lens = str(meta.lens);
    if (!lens || !LENSES.some((l) => l.slug === lens)) {
      say(`skip thread with unknown lens: threads/${f}`);
      continue;
    }
    const learned = body.split(/^# What we learned\s*$/m)[1]?.trim();
    const line = formatThread({
      question: String(meta.title ?? "").trim(),
      status: str(meta.status) ?? "open",
      starred: meta.starred === true,
      depth: Number(meta.depth ?? 1),
      created: str(meta.created),
    });
    byLens.set(lens, [...(byLens.get(lens) ?? []), line + (learned ? `\n  - Learned: ${learned.replace(/\s*\n\s*/g, " ")}` : "")]);
  }
  for (const [lens, lines] of byLens) {
    say(`${lines.length} thread${lines.length === 1 ? "" : "s"} → me/${lens}.md`);
    if (dry) continue;
    const rel = ensureLens(root, lens, "claude");
    const n = readNote(root, rel);
    let body = n.body.replace(/^Run `brain thread list[^\n]*\n?/m, "");
    for (const l of lines) body = appendToSection(body, THREADS_HEADING, l);
    writeNote(root, rel, n.meta, body);
    moved += lines.length;
  }
  if (!dry) {
    for (const f of files) unlinkSync(join(tdir, f));
    for (const f of readdirSync(tdir)) if (f === ".gitkeep" || f === ".DS_Store") unlinkSync(join(tdir, f));
    if (!readdirSync(tdir).length) rmdirSync(tdir);
  }
}

// ---- 2. labels -----------------------------------------------------------
const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
let slimmed = 0;
for (const n of loadAll(root)) {
  const m: Meta = { ...n.meta };
  const before = JSON.stringify(m);
  const gen = m.generated as Record<string, unknown> | undefined;
  if (gen && isOwnerWriter(gen.by)) delete m.generated;
  if (m.created_at !== undefined) {
    if (m.created === undefined) m.created = String(m.created_at).slice(0, 16);
    delete m.created_at;
  }
  if (m.client_id !== undefined) delete m.client_id; // all came from local adds; only the phone needs it
  if (m.verified !== undefined && !m.generated) delete m.verified; // the owner checking their own words says nothing
  if (m.type === "Capture" && m.title && norm(n.body).startsWith(norm(String(m.title)).slice(0, 40))) delete m.title;
  if (m.type === "Capture" && m.description && norm(String(m.description)) === norm(String(m.title ?? n.body))) delete m.description;
  const changed = JSON.stringify(m) !== before;
  if (changed) slimmed++;
  if (!dry) writeNote(root, n.path, m, n.body.replace(/^Run `brain thread list[^\n]*\n?/m, "")); // rewrite all: one-line lists
}
say(`${slimmed} notes had labels slimmed. All notes rewritten with one-line lists.`);
if (!dry) log(root, `roll-up: ${moved} threads moved into lens notes; ${slimmed} notes slimmed`);
