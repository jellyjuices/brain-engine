// Journal notes: one note per entry, kept whole. Each waits (`sorted: false`) until it is sorted into bits.

import { addJournalNote, journalFor, sortJournal, waitingJournals } from "../../capture/journal.ts";
import type { SortBit } from "../../capture/file.ts";
import { alreadyFiled, phoneMark } from "../../capture/pull.ts";
import { loadAll } from "../../core/files.ts";
import { str, titleOf, type Note } from "../../core/notes.ts";
import type { UnsortedItem } from "../api-types.ts";
import { HttpError, MAX_FILE } from "../server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, safeNotePath, text } from "../server-context.ts";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export const isJournalPath = (raw: unknown): raw is string => typeof raw === "string" && raw.startsWith("journal/");

/** An add marked as journal. A retry with the same client_id or the same text makes no copy. */
export function addJournalEntry(c: Ctx, body: { text: string; client_id: string; created_at?: string; title?: string; by?: string }) {
  if (alreadyFiled(c.root, body.client_id)) return { saved: "skipped" as const, ...journalFor(c.root, phoneMark(body.client_id)) };
  const r = afterWrite(c.root, () => addJournalNote(c.root, loadAll(c.root), { text: body.text, at: body.created_at, title: body.title, by: body.by, tag: phoneMark(body.client_id) }));
  return { saved: r.created ? ("journal" as const) : ("skipped" as const), path: r.path, title: r.title };
}

function aboutOf(c: Ctx): { title: string; path: string } | undefined {
  const raw = text(c.body.about, "about", false);
  if (!raw) return undefined;
  const note: Note = existingNote(c.root, safeNotePath(raw, true));
  return { title: titleOf(note), path: note.path };
}

/** The phone's Journal: one note per entry, whole. The same text that day returns that note. */
export function addJournal(c: Ctx) {
  const date = text(c.body.date, "date")!.trim();
  if (!DAY.test(date) || Number.isNaN(Date.parse(date))) throw new HttpError(400, `"date" must look like 2026-11-05.`);
  const body = text(c.body.text, "text")!;
  if (!body.trim()) throw new HttpError(400, `Missing "text".`);
  if (Buffer.byteLength(body) > MAX_FILE) throw new HttpError(413, "A journal entry can be 60 KB at most.");
  const clientId = text(c.body.client_id, "client_id", false);
  const prior = clientId && alreadyFiled(c.root, clientId) ? journalFor(c.root, phoneMark(clientId)) : undefined;
  if (prior) return { ...prior, created: false };
  const input = { text: body, day: date, at: text(c.body.created_at, "created_at", false), title: text(c.body.title, "title", false), about: aboutOf(c), ...(clientId && { tag: phoneMark(clientId) }) };
  return afterWrite(c.root, () => addJournalNote(c.root, loadAll(c.root), input));
}

/** Sort one journal note into its bits. The note stays whole and stops waiting. */
export function sortJournalRoute(c: Ctx, raw: string, bits: SortBit[]) {
  const path = safeNotePath(raw, true);
  for (const b of bits) existingNote(c.root, b.into);
  const r = afterWrite(c.root, () => asUserError(() => sortJournal(c.root, loadAll(c.root), path, bits)));
  return { into: r.into[0], filed: r.into, kept: r.kept };
}

export function waitingItems(notes: Note[]): UnsortedItem[] {
  return waitingJournals(notes).map((n) => ({ path: n.path, created: str(n.meta.date), text: n.body.trim(), kind: "journal", title: titleOf(n) }));
}
