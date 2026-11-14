// Journal entries: written whole into the day note, where they wait to be sorted into bits.

import { addEntry, sortEntry, waitingEntries } from "../../capture/journal.ts";
import type { SortBit } from "../../capture/file.ts";
import { alreadyFiled, phoneMark } from "../../capture/pull.ts";
import { loadAll } from "../../core/files.ts";
import { titleOf, type Note } from "../../core/notes.ts";
import type { UnsortedItem } from "../api-types.ts";
import { HttpError, MAX_FILE } from "../server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, safeNotePath, text } from "../server-context.ts";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const REF = /^(journal\/\d{4}-\d{2}-\d{2}\.md)#(\d{4}(?:-\d+)?)$/;

export const isEntryRef = (raw: unknown): raw is string => typeof raw === "string" && raw.includes("#");

/** A journal entry ref from unsorted, like `journal/2026-11-14.md#0930`. */
export function entryRef(raw: string): string {
  const m = raw.match(REF);
  if (!m) throw new HttpError(400, "That is not a journal entry.");
  safeNotePath(m[1], true);
  return raw;
}

/** An add marked as journal. A retry with the same client_id or the same text makes no copy. */
export function addJournalEntry(c: Ctx, body: { text: string; client_id: string; created_at?: string; by?: string }) {
  if (alreadyFiled(c.root, body.client_id)) return { saved: "skipped" as const, path: undefined };
  const e = afterWrite(c.root, () => addEntry(c.root, { text: body.text, at: body.created_at, by: body.by, tag: phoneMark(body.client_id) }));
  return { saved: e.created ? ("journal" as const) : ("skipped" as const), path: e.path };
}

function aboutOf(c: Ctx): { title: string; path: string } | undefined {
  const raw = text(c.body.about, "about", false);
  if (!raw) return undefined;
  const note: Note = existingNote(c.root, safeNotePath(raw, true));
  return { title: titleOf(note), path: note.path };
}

/** The phone's Journal: one entry for a day, whole, under its time. The same text that day returns that entry. */
export function addJournal(c: Ctx) {
  const date = text(c.body.date, "date")!.trim();
  if (!DAY.test(date) || Number.isNaN(Date.parse(date))) throw new HttpError(400, `"date" must look like 2026-11-05.`);
  const body = text(c.body.text, "text")!;
  if (!body.trim()) throw new HttpError(400, `Missing "text".`);
  if (Buffer.byteLength(body) > MAX_FILE) throw new HttpError(413, "A journal entry can be 60 KB at most.");
  const title = text(c.body.title, "title", false)?.trim().replace(/\s+/g, " ").slice(0, 120);
  const whole = title && body.trim().split("\n")[0].trim() !== title ? `${title}\n${body}` : body;
  const about = aboutOf(c);
  const at = text(c.body.created_at, "created_at", false);
  const e = afterWrite(c.root, () => addEntry(c.root, { text: whole, day: date, at, about }));
  return { path: e.path, entry: e.ref, created: e.created };
}

/** Sort one journal entry into its bits. The entry stays whole and stops waiting. */
export function sortJournal(c: Ctx, ref: string, bits: SortBit[]) {
  for (const b of bits) existingNote(c.root, b.into);
  const r = afterWrite(c.root, () => asUserError(() => sortEntry(c.root, loadAll(c.root), ref, bits)));
  return { into: r.into[0], filed: r.into, kept: r.kept };
}

export function waitingItems(notes: Note[]): UnsortedItem[] {
  return waitingEntries(notes).map((e) => ({ path: e.ref, created: `${e.day}T${e.time}`, text: e.text, kind: "journal" }));
}
