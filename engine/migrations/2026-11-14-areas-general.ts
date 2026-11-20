// Areas and General (2026-11-14). Dry run by default; --write applies. Run: brain migrate areas-general [--write]
//   1. `area: x` becomes `areas: [x]`. A Goal or Decision with no areas is listed.
//   2. Makes areas/general.md from the starter if it is missing.
//   3. A capture in inbox/ that names only people becomes a to-do in General, `· with` each person. The capture is deleted.
//   4. `# Open loops` becomes `# To-dos`. Old marks in to-do lines become When tokens. `· today` is removed and the line listed.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { appendToSection, LOOPS_HEADING } from "../shared/line/index.ts";
import { loadAll, notePaths, readNote, writeAtomic } from "../src/core/files.ts";
import { brainHome, dump } from "../src/core/notes.ts";
import { captureMove, GENERAL, STARTER_GENERAL, type CaptureMove } from "./areas-general/captures.ts";
import { emptyLists, mergeLists, migrateText, type Change, type OwnerLists } from "./areas-general/note.ts";
import { report } from "./areas-general/report.ts";

export interface MigrateResult {
  changes: Change[];
  lists: OwnerLists;
  dirty?: string;
  wrote: boolean;
}

function gitDirty(root: string): string | undefined {
  try {
    const status = execFileSync("git", ["-C", root, "status", "--porcelain"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } });
    return status.trim() ? "the notes folder has changes that are not committed" : undefined;
  } catch {
    return "the notes folder is not a git repo";
  }
}

function plan(root: string): { changes: Change[]; lists: OwnerLists; moves: CaptureMove[] } {
  const notes = loadAll(root);
  const changes: Change[] = [];
  const lists = emptyLists();
  if (!existsSync(join(root, GENERAL))) changes.push({ path: GENERAL, kind: "general", what: "make General from the starter" });
  const moves = notes.flatMap((n) => captureMove(notes, n) ?? []);
  for (const m of moves) {
    changes.push({ path: m.capture, kind: "capture", what: `to-do moves to ${GENERAL} ${LOOPS_HEADING} with ${m.people} people; capture deleted` });
    if (m.undated) lists.undated.push(m.capture);
  }
  const moved = new Set(moves.map((m) => m.capture));
  for (const n of notes.filter((x) => !moved.has(x.path))) {
    const r = migrateText(n.path, readFileSync(join(root, n.path), "utf8"));
    changes.push(...r.changes);
    mergeLists(lists, r.lists);
  }
  return { changes, lists, moves };
}

function moveCapture(root: string, move: CaptureMove): void {
  const notes = loadAll(root);
  const cap = notes.find((n) => n.path === move.capture);
  const fresh = cap && captureMove(notes, cap);
  if (!fresh) return;
  const general = readNote(root, GENERAL);
  if (!general.body.split("\n").includes(fresh.line)) writeAtomic(join(root, GENERAL), dump(general.meta, appendToSection(general.body, LOOPS_HEADING, fresh.line)));
  unlinkSync(join(root, fresh.capture));
}

function apply(root: string, moves: CaptureMove[]): void {
  if (!existsSync(join(root, GENERAL))) writeAtomic(join(root, GENERAL), readFileSync(STARTER_GENERAL, "utf8"));
  for (const m of moves) moveCapture(root, m);
  for (const rel of notePaths(root)) {
    const full = join(root, rel);
    const text = readFileSync(full, "utf8");
    const next = migrateText(rel, text).text;
    if (next !== text) writeAtomic(full, next);
  }
}

export function migrateAreasGeneral(root: string, opts: { write?: boolean } = {}): MigrateResult {
  const dirty = gitDirty(root);
  const { changes, lists, moves } = plan(root);
  if (!opts.write || dirty) return { changes, lists, dirty, wrote: false };
  apply(root, moves);
  return { changes, lists, wrote: true };
}

export function runAreasGeneral(root: string, write: boolean, say: (s: string) => void): number {
  const result = migrateAreasGeneral(root, { write });
  for (const line of report(result.changes, result.lists, { write, wrote: result.wrote, dirty: result.dirty })) say(line);
  return write && !result.wrote ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runAreasGeneral(brainHome(), process.argv.includes("--write"), (s) => process.stdout.write(s + "\n"));
}
