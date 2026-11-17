// Resumable flows: a multi-step add, sort or builder saves its state here, so the owner can pick it up later.
// Drafts live in .brain/drafts/<id>.json, made by brain and never a note. An add, sort or make with `draft_id` clears it.

import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { writeAtomic } from "../../core/files.ts";
import { nowStamp } from "../../core/notes.ts";
import { DRAFT_KINDS, type Draft, type DraftKind, type DraftsResponse, type DeletedResponse } from "../api-types.ts";
import { HttpError, MAX_CAPTURE } from "../server-auth.ts";
import { type Ctx, text } from "../server-context.ts";

const ID = /^[a-z0-9-]{1,40}$/;
const DRAFT_DAYS = 14;
const dir = (root: string) => join(root, ".brain", "drafts");

function draftFile(root: string, id: string): string {
  if (!ID.test(id)) throw new HttpError(400, "That draft id is not valid.");
  return join(dir(root), `${id}.json`);
}

function readDraft(root: string, id: string): Draft {
  const file = draftFile(root, id);
  if (!existsSync(file)) throw new HttpError(404, `No draft ${id}.`);
  return JSON.parse(readFileSync(file, "utf8")) as Draft;
}

/** Remove a draft once its flow is done. A missing draft is fine: a retry may come after the first one cleared it. */
export function clearDraft(root: string, id: unknown): void {
  if (typeof id !== "string" || !id) return;
  const file = draftFile(root, id);
  if (existsSync(file)) unlinkSync(file);
}

function pruneDrafts(root: string): void {
  if (!existsSync(dir(root))) return;
  const cutoff = Date.now() - DRAFT_DAYS * 86_400_000;
  for (const f of readdirSync(dir(root)).filter((x) => x.endsWith(".json"))) {
    const updated = Date.parse((JSON.parse(readFileSync(join(dir(root), f), "utf8")) as Draft).updated);
    if (updated < cutoff) unlinkSync(join(dir(root), f));
  }
}

export function saveDraft(c: Ctx): Draft {
  pruneDrafts(c.root);
  const kind = text(c.body.kind, "kind") as DraftKind;
  if (!DRAFT_KINDS.includes(kind)) throw new HttpError(400, `"kind" must be one of: ${DRAFT_KINDS.join(", ")}.`);
  const data = c.body.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new HttpError(400, `"data" must be an object.`);
  if (Buffer.byteLength(JSON.stringify(data)) > MAX_CAPTURE) throw new HttpError(413, "A draft can be 64 KB at most.");
  const id = text(c.body.id, "id", false) ?? randomBytes(6).toString("hex");
  const file = draftFile(c.root, id);
  const now = nowStamp();
  const created = existsSync(file) ? readDraft(c.root, id).created : now;
  const step = text(c.body.step, "step", false);
  const draft: Draft = { id, kind, ...(step && { step }), data: data as Record<string, unknown>, created, updated: now };
  mkdirSync(dir(c.root), { recursive: true });
  writeAtomic(file, JSON.stringify(draft, null, 2) + "\n");
  return draft;
}

export function listDrafts(c: Ctx): DraftsResponse {
  pruneDrafts(c.root);
  if (!existsSync(dir(c.root))) return { drafts: [] };
  const kind = c.url.searchParams.get("kind");
  const drafts = readdirSync(dir(c.root))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readDraft(c.root, f.slice(0, -5)))
    .filter((d) => !kind || d.kind === kind)
    .sort((a, b) => b.updated.localeCompare(a.updated));
  return { drafts };
}

export const oneDraft = (c: Ctx, id: string): Draft => readDraft(c.root, id);

export function dropDraft(c: Ctx, id: string): DeletedResponse {
  const had = existsSync(draftFile(c.root, id));
  clearDraft(c.root, id);
  return { deleted: had };
}
