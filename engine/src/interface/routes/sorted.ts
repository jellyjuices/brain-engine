import { areaForTag } from "../../capture/picked.ts";
import { moveLine, sortedLines } from "../../capture/sorted.ts";
import { loadAll } from "../../core/files.ts";
import type { MoveLineResponse, SortedResponse } from "../api-types.ts";
import { HttpError } from "../server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, safeNotePath, text } from "../server-context.ts";

export function sortedRoute(c: Ctx): SortedResponse {
  const subjects = sortedLines(c.root);
  return { count: subjects.reduce((n, s) => n + s.lines.length, 0), subjects };
}

function moveTo(c: Ctx, into: string): MoveLineResponse {
  const from = safeNotePath(text(c.body.path, "path")!, true);
  existingNote(c.root, from);
  existingNote(c.root, into);
  const line = text(c.body.line, "line")!;
  return afterWrite(c.root, () => asUserError(() => moveLine(c.root, from, line, into)));
}

export function moveLineRoute(c: Ctx): MoveLineResponse {
  return moveTo(c, safeNotePath(text(c.body.into, "into")!, true));
}

export function retagRoute(c: Ctx): MoveLineResponse {
  const tag = text(c.body.tag, "tag")!.trim();
  const area = areaForTag(loadAll(c.root), tag);
  if (!area) throw new HttpError(400, `No area matches the tag "${tag}". Pick a tag an area uses.`);
  return moveTo(c, area.path);
}
