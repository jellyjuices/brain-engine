import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCard, matchSubject } from "../reports/card.ts";
import { SLUG, summary } from "../core/notes.ts";
import { loadAll, notePaths } from "../core/files.ts";
import { areaBrief, areaMarkdown, todayMarkdown, todayReport, weeklyMarkdown, weeklyReport } from "../reports/reports.ts";
import { changedVectors, feedModel, list, search } from "../core/search.ts";
import type { NotesSinceResponse } from "./api-types.ts";
import { dayList, ref } from "../todos/day-list.ts";
import { LENSES, lensPath, lensPrivacy } from "../intake/lenses.ts";
import { changeFiles } from "../core/log.ts";
import { saveLensAnswer } from "../intake/lens-answers.ts";
import { listThreads, updateThread } from "../intake/threads.ts";
import { HttpError } from "./server-auth.ts";
import { afterWrite, type Ctx, existingNote, fullNoteJson, noteJson, safeNotePath, text } from "./server-context.ts";
import { OWNER_BY, ownerWriters } from "../core/owner.ts";

export function health(root: string) {
  const pkg = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "package.json"), "utf8")) as { version: string };
  return { ok: true, version: pkg.version, note_count: notePaths(root).length };
}

export function notesSince(c: Ctx): NotesSinceResponse {
  const raw = c.url.searchParams.get("since");
  const since = raw ? Date.parse(raw) : 0;
  if (Number.isNaN(since)) throw new HttpError(400, `"since" must be an ISO date or time.`);
  const now = new Date().toISOString();
  const notes = loadAll(c.root).filter((n) => n.mtime >= since);
  const model = feedModel();
  return { now, notes: notes.map((n) => noteJson(c.root, n)), model, vectors: changedVectors(c.root, since, model) };
}

export function oneNote(c: Ctx, rawPath: string) {
  const note = existingNote(c.root, safeNotePath(rawPath, false));
  return fullNoteJson(c.root, loadAll(c.root), note);
}

export function cardRoute(c: Ctx) {
  const query = c.url.searchParams.get("q") ?? "";
  if (!query.trim()) throw new HttpError(400, `Missing "q".`);
  const hits = search(c.root, query);
  const notes = loadAll(c.root);
  const subject = matchSubject(notes, query);
  const card = subject && buildCard(c.root, notes, subject);
  return card ? { card, hits } : hits;
}

export function report(c: Ctx, rawName: string) {
  let name = rawName;
  try {
    name = decodeURIComponent(rawName);
  } catch {
    throw new HttpError(400, "That name is not valid.");
  }
  if (name === "today") {
    const r = todayReport(c.root);
    return { ...r, markdown: todayMarkdown(r) };
  }
  if (name === "weekly") {
    const r = weeklyReport(c.root);
    return { ...r, markdown: weeklyMarkdown(r) };
  }
  const area = /^area\/(.+)$/.exec(name)?.[1];
  if (!area || !SLUG.test(area)) throw new HttpError(404, `No report named ${name}.`);
  const brief = areaBrief(c.root, area);
  return { ...brief, note: brief.note && summary(brief.note), markdown: areaMarkdown(brief) };
}

const intakeWriters = () => [...ownerWriters(), "gemini-nano"];

export function intakeNext(c: Ctx) {
  const threads = listThreads(c.root, { status: "open" })
    .slice(0, 10)
    .map((t) => ({ question: t.question, lens: t.lens, privacy: lensPrivacy(c.root, t.lens) }))
    .filter((t) => t.privacy !== "skip");
  return { threads };
}

export function intakeSave(c: Ctx) {
  const lens = text(c.body.lens, "lens")!.trim();
  const question = text(c.body.question, "question")!.trim();
  const line = text(c.body.line, "line")!.trim();
  if (!line) throw new HttpError(400, `Missing "line".`);
  const by = text(c.body.by, "by", false) ?? OWNER_BY;
  if (!intakeWriters().includes(by)) throw new HttpError(400, `"by" must be one of: ${intakeWriters().join(", ")}.`);
  const raw = text(c.body.raw, "raw", false)?.trim();
  try {
    const keepRaw = lensPrivacy(c.root, lens) === "full";
    const note = afterWrite(c.root, () => saveLensAnswer(c.root, lens, line, { question, raw: keepRaw ? raw : undefined, by, thread: question }));
    return { path: note.path };
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
}

export function intakeSkip(c: Ctx) {
  const question = text(c.body.question, "question")!.trim();
  try {
    const lenses = LENSES.map((l) => lensPath(l.slug));
    afterWrite(c.root, () => changeFiles(c.root, lenses, `intake: later: ${question}`, () => updateThread(c.root, question, { status: "parked", by: OWNER_BY })));
    return { ok: true };
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
}

export function todayRoute(c: Ctx) {
  const items = dayList(c.root).map((x) => ({ ...x, ref: x.kind === "event" ? x.path : ref(x.path, x.text) }));
  return { date: new Date().toLocaleDateString("en-CA"), items };
}

export function listRoute(c: Ctx) {
  const params = c.url.searchParams;
  const limit = params.get("limit") ? Number(params.get("limit")) : undefined;
  return list(c.root, { type: params.get("type") ?? undefined, tag: params.get("tag") ?? undefined, area: params.get("area") ?? undefined, status: params.get("status") ?? undefined, limit });
}
