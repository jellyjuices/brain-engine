// Add, sort and the Unsorted count. An add the owner tagged, or gave a person or a subject, is filed at once.

import { captureText } from "../../todos/absorb.ts";
import { BIT_KINDS, type SortBit, sortBits, whenFrom } from "../../capture/file.ts";
import { GENERAL } from "../../capture/picked.ts";
import { saveItem } from "../../capture/pull.ts";
import { loadAll } from "../../core/files.ts";
import { folderOf, str } from "../../core/notes.ts";
import { isOwnerWriter } from "../../core/owner.ts";
import type { AddResponse, SortResponse, UnsortedItem, UnsortedResponse } from "../api-types.ts";
import { addJournalEntry, isJournalPath, sortJournalRoute, waitingItems } from "./journal.ts";
import { HttpError, MAX_CAPTURE } from "../server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, safeNotePath, text, textList } from "../server-context.ts";
import { clearDraft } from "./drafts.ts";

const AGENT_BY = "agent";

/** Who wrote it. The owner's calls carry no `by`. A helper's call always does, and never an owner's name. */
function writer(c: Ctx): string | undefined {
  if (c.caller !== "agent") return undefined;
  const by = text(c.body.by, "by", false)?.trim();
  return by && !isOwnerWriter(by) ? by : AGENT_BY;
}

const notePaths = (v: unknown, name: string) => textList(v, name)?.map((p) => safeNotePath(p, true));

export function addRoute(c: Ctx): AddResponse {
  const t = text(c.body.text, "text")!.trim();
  if (!t) throw new HttpError(400, `Missing "text".`);
  if (Buffer.byteLength(t) > MAX_CAPTURE) throw new HttpError(413, "A capture can be 64 KB at most.");
  const clientId = text(c.body.client_id, "client_id")!;
  const kind = text(c.body.kind, "kind", false);
  if (kind && kind !== "todo" && kind !== "journal") throw new HttpError(400, `"kind" must be todo or journal.`);
  if (kind === "journal") {
    const r = addJournalEntry(c, { text: t, client_id: clientId, created_at: text(c.body.created_at, "created_at", false), title: text(c.body.title, "title", false), by: writer(c) });
    clearDraft(c.root, c.body.draft_id);
    return { ...r, client_id: clientId };
  }
  const item = {
    client_id: clientId,
    text: t,
    tags: textList(c.body.tags, "tags"),
    created_at: text(c.body.created_at, "created_at", false),
    into: text(c.body.into, "into", false),
    about: notePaths(c.body.about, "about"),
    people: notePaths(c.body.people, "people"),
    by: writer(c),
  };
  const { saved, path } = afterWrite(c.root, () => saveItem(c.root, item));
  clearDraft(c.root, c.body.draft_id);
  return { path, client_id: clientId, saved };
}

export function inboxPath(raw: unknown, name: string): string {
  const path = safeNotePath(text(raw, name)!, true);
  if (!path.startsWith("inbox/")) throw new HttpError(400, "That is not in the inbox.");
  return path;
}

function whenOf(raw: unknown, name: string) {
  const when = whenFrom(text(raw, name)!);
  if (!when) throw new HttpError(400, `"${name}" is not a day I know.`);
  return when;
}

function bitsOf(c: Ctx): SortBit[] {
  const raw = c.body.bits;
  if (raw === undefined) {
    const picked = typeof c.body.into === "string" ? c.body.into.trim() : "";
    return [{ into: picked ? safeNotePath(picked, true) : GENERAL, when: whenOf(c.body.when, "when") }];
  }
  if (!Array.isArray(raw) || !raw.length) throw new HttpError(400, `"bits" must be a list with at least one line.`);
  return raw.map((b: Record<string, unknown>, i) => {
    if (!b || typeof b !== "object") throw new HttpError(400, `"bits" ${i + 1} must be an object.`);
    return { into: safeNotePath(text(b.into, "into")!, true), when: whenOf(b.when, "when"), text: text(b.text, "text", false), with: notePaths(b.with, "with"), re: notePaths(b.re, "re"), kind: kindOf(b.kind), about: text(b.about, "about", false) };
  });
}

function kindOf(raw: unknown): SortBit["kind"] {
  const kind = text(raw, "kind", false);
  if (kind === undefined) return undefined;
  if (!(BIT_KINDS as readonly string[]).includes(kind)) throw new HttpError(400, `"kind" must be one of: ${BIT_KINDS.join(", ")}.`);
  return kind as SortBit["kind"];
}

/** Sort one capture into its subjects. The capture is deleted, and one undo reverses the whole sort. A journal note is kept whole. */
export function sortRoute(c: Ctx): SortResponse {
  if (isJournalPath(c.body.path)) {
    const r = sortJournalRoute(c, c.body.path, bitsOf(c));
    clearDraft(c.root, c.body.draft_id);
    return r;
  }
  const path = inboxPath(c.body.path, "path");
  const bits = bitsOf(c);
  existingNote(c.root, path);
  for (const b of bits) existingNote(c.root, b.into);
  const r = afterWrite(c.root, () => asUserError(() => sortBits(c.root, loadAll(c.root), path, bits)));
  clearDraft(c.root, c.body.draft_id);
  return { into: r.into[0], filed: r.into, deleted: r.deleted };
}

/** Captures in the inbox and journal notes that wait to be sorted, oldest first. */
export function unsortedRoute(c: Ctx): UnsortedResponse {
  const notes = loadAll(c.root);
  const captures: UnsortedItem[] = notes
    .filter((n) => folderOf(n) === "inbox")
    .map((n) => ({ path: n.path, created: str(n.meta.created), text: captureText(n), kind: "capture" }));
  const items = [...captures, ...waitingItems(notes)].sort((a, b) => (a.created ?? "").localeCompare(b.created ?? ""));
  return { count: items.length, items };
}
