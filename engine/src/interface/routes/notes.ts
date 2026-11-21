import { posix } from "node:path";
import { appendToSection } from "../../../shared/line/index.ts";
import { buildNote } from "../../capture/build.ts";
import { loadAll, moveNote, readNote, slugify, uniquePath, writeNote } from "../../core/files.ts";
import { changeFiles } from "../../core/log.ts";
import { DIRS, type Meta, nowStamp, titleOf, typeOf } from "../../core/notes.ts";
import { headingForType, relationsIn } from "../../core/relations.ts";
import { change } from "../../todos/undo.ts";
import type { AddRelationResponse, DeleteNoteResponse, MadeResponse, RelationsResponse } from "../api-types.ts";
import { HttpError } from "../server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, safeNotePath, text } from "../server-context.ts";
import { specParts } from "./build-input.ts";
import { clearDraft } from "./drafts.ts";

const NOT_MADE_HERE = ["Capture"];

export function makeNote(c: Ctx): MadeResponse {
  const type = text(c.body.type, "type")!.trim();
  if (NOT_MADE_HERE.includes(type)) throw new HttpError(400, "A capture comes from an add, not from here.");
  const title = text(c.body.title, "title")!.trim().replace(/\s+/g, " ");
  if (!title || title.length > 120) throw new HttpError(400, `"title" must be 1 to 120 characters.`);
  const description = text(c.body.description, "description", false)?.trim().slice(0, 150) ?? "";
  const same = loadAll(c.root).find((n) => typeOf(n) === type && titleOf(n).toLowerCase() === title.toLowerCase());
  if (same) return { path: same.path, created: false };
  const extra: Meta = c.caller === "agent" ? { generated: { by: "agent", at: nowStamp() } } : {};
  const note = afterWrite(c.root, () => asUserError(() => buildNote(c.root, { type, title, description, extra, ...specParts(c.body) })));
  clearDraft(c.root, c.body.draft_id);
  return { path: note.path, created: true };
}

export function deleteNote(c: Ctx, rawPath: string): DeleteNoteResponse {
  const path = safeNotePath(rawPath, true);
  const note = existingNote(c.root, path);
  const archived = uniquePath(c.root, DIRS.archive, slugify(path.split("/").pop()!.replace(/\.md$/, "")));
  afterWrite(c.root, () => changeFiles(c.root, [path, archived], `deleted ${path} → ${archived}`, () => moveNote(c.root, path, archived, note.meta, note.body)));
  return { path, archived };
}

export function relationsRoute(c: Ctx): RelationsResponse {
  const path = safeNotePath(text(c.url.searchParams.get("path"), "path")!, false);
  const note = existingNote(c.root, path);
  const incoming = loadAll(c.root).filter((n) => n.path !== path).flatMap(relationsIn).filter((r) => r.to === path);
  return { path, out: relationsIn(note), in: incoming };
}

export function addRelation(c: Ctx): AddRelationResponse {
  const from = safeNotePath(text(c.body.from, "from")!, true);
  const to = safeNotePath(text(c.body.to, "to")!, true);
  if (from === to) throw new HttpError(400, "A note cannot link to itself.");
  existingNote(c.root, from);
  const target = existingNote(c.root, to);
  const clean = (v: unknown, name: string) => text(v, name, false)?.replace(/[·\n]/g, " ").trim();
  const [role, time] = [clean(c.body.role, "role"), clean(c.body.time, "time")];
  const line = [`- [${titleOf(target).split(",")[0]}](${posix.relative(posix.dirname(from), to)})`, role, time].filter(Boolean).join(" · ");
  const linked = [...relationsIn(readNote(c.root, from)), ...relationsIn(target)].some((r) => (r.from === from && r.to === to) || (r.from === to && r.to === from));
  if (linked) return { from, to, line, created: false };
  const heading = headingForType(typeOf(target));
  afterWrite(c.root, () =>
    change(c.root, from, `linked ${from} to ${to}`, () => {
      const n = readNote(c.root, from);
      writeNote(c.root, from, n.meta, appendToSection(n.body, heading, line));
    }),
  );
  return { from, to, line, created: true };
}
