import { applyTriage, newNote } from "../capture/actions.ts";
import { dump, type Meta, type Note, parse, typeOf } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { undoLast } from "../core/log.ts";
import { loadSchema } from "../core/schema.ts";
import { statusesFor } from "../core/schema-kinds.ts";
import { move } from "../todos/verbs.ts";
import { change } from "../todos/undo.ts";
import { dropDone, editTodoText, reopen } from "../todos/reopen.ts";
import { skip, stopRepeat } from "../todos/repeat.ts";
import { inboxPath } from "./routes/capture.ts";
import { doneWith, dropWith } from "../todos/wrapup.ts";
import { HttpError, MAX_FILE } from "./server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, fileText, fullNoteJson, hash, safeNotePath, text, textList } from "./server-context.ts";

const BIRTHDAY = /^\d{4}-\d{2}-\d{2}$/;

function birthdayOf(raw: unknown): string | undefined {
  const b = text(raw, "birthday", false)?.trim();
  if (!b) return undefined;
  if (!BIRTHDAY.test(b) || Number.isNaN(Date.parse(b))) throw new HttpError(400, `"birthday" must look like 1990-05-04.`);
  return b;
}

/** A new Person note from the phone. A name that is already a Person returns that note, so a retry makes no copy. */
export function addPerson(c: Ctx) {
  const name = text(c.body.name, "name")!.trim().replace(/\s+/g, " ");
  if (!name) throw new HttpError(400, `Missing "name".`);
  if (name.length > 80) throw new HttpError(400, "A name can be 80 characters at most.");
  const birthday = birthdayOf(c.body.birthday);
  const description = text(c.body.description, "description", false)?.trim().slice(0, 150) || "Added from the phone.";
  const same = loadAll(c.root).find((n) => n.meta.type === "Person" && String(n.meta.title ?? "").toLowerCase() === name.toLowerCase());
  if (same) return { path: same.path, created: false };
  const note = afterWrite(c.root, () => newNote(c.root, "Person", name, { description, ...(birthday && { birthday }) }));
  return { path: note.path, created: true };
}

const SUBJECT_TYPES = ["Place", "Thing"];

/** A new Place or Thing note from the phone. A name that already exists for that type returns that note. */
export function addSubject(c: Ctx) {
  const type = text(c.body.type, "type")!;
  if (!SUBJECT_TYPES.includes(type)) throw new HttpError(400, `"type" must be Place or Thing.`);
  const name = text(c.body.name, "name")!.trim().replace(/\s+/g, " ");
  if (!name) throw new HttpError(400, `Missing "name".`);
  if (name.length > 80) throw new HttpError(400, "A name can be 80 characters at most.");
  const same = loadAll(c.root).find((n) => n.meta.type === type && String(n.meta.title ?? "").toLowerCase() === name.toLowerCase());
  if (same) return { path: same.path, created: false };
  const note = afterWrite(c.root, () => newNote(c.root, type, name, { description: "Added from the phone." }));
  return { path: note.path, created: true };
}

/** A text file from the phone becomes a Note in resources/. The same title and text returns that note, so a retry makes no copy. */
const FILE_ASKS = ["split", "intake", "enrich"];

export function addFile(c: Ctx) {
  const title = text(c.body.title, "title")!.trim().replace(/\s+/g, " ");
  if (!title) throw new HttpError(400, `Missing "title".`);
  if (title.length > 120) throw new HttpError(400, "A title can be 120 characters at most.");
  const body = text(c.body.text, "text")!;
  if (Buffer.byteLength(body) > MAX_FILE) throw new HttpError(413, "A file can be 60 KB at most.");
  const asks = textList(c.body.asks, "asks") ?? [];
  const odd = asks.find((a) => !FILE_ASKS.includes(a));
  if (odd) throw new HttpError(400, `"asks" must be from: ${FILE_ASKS.join(", ")}.`);
  const same = loadAll(c.root).find((n) => n.meta.type === "Note" && String(n.meta.title ?? "") === title && n.body.trim() === body.trim());
  if (same) return { path: same.path, created: false };
  const made = afterWrite(c.root, () => {
    const note = newNote(c.root, "Note", title, { description: `File added from the phone: ${title}`.slice(0, 150), tags: ["reference"], ...(asks.length && { asks }) });
    return writeNote(c.root, note.path, note.meta, `${body.trimEnd()}\n`);
  });
  return { path: made.path, created: true };
}

/** Take an inbox item out of the inbox. It moves to .archive/ and is never deleted. */
export function inboxDrop(c: Ctx) {
  const path = inboxPath(c.body.path, "path");
  existingNote(c.root, path);
  return afterWrite(c.root, () => asUserError(() => applyTriage(c.root, path, { outcome: "drop" })));
}

/** Set or change the birthday on a Person note. */
export function setBirthday(c: Ctx) {
  const path = safeNotePath(text(c.body.path, "path")!, true);
  const birthday = birthdayOf(c.body.birthday);
  if (!birthday) throw new HttpError(400, `Missing "birthday".`);
  const note = existingNote(c.root, path);
  if (note.meta.type !== "Person") throw new HttpError(400, "Only a Person has a birthday.");
  afterWrite(c.root, () => change(c.root, path, `birthday: ${path}`, () => void writeNote(c.root, path, { ...note.meta, birthday }, note.body)));
  return fullNoteJson(c.root, loadAll(c.root), readNote(c.root, path));
}

export const doneRoute = (c: Ctx) =>
  afterWrite(c.root, () => asUserError(() => doneWith(c.root, text(c.body.ref, "ref")!, { happened: text(c.body.happened, "happened", false), follow_up: text(c.body.follow_up, "follow_up", false) })));

export const moveRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => move(c.root, text(c.body.ref, "ref")!, text(c.body.when, "when")!, { who: text(c.body.who, "who", false), what: text(c.body.what, "what", false) })));

export const dropRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => dropDone(c.root, text(c.body.ref, "ref")!) ?? dropWith(c.root, text(c.body.ref, "ref")!, text(c.body.why, "why", false))));

export const reopenRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => reopen(c.root, text(c.body.ref, "ref")!)));

export const skipRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => skip(c.root, text(c.body.ref, "ref")!)));

export const stopRepeatRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => stopRepeat(c.root, text(c.body.ref, "ref")!)));

export const editTodoRoute =(c: Ctx) => afterWrite(c.root, () => asUserError(() => editTodoText(c.root, text(c.body.ref, "ref")!, text(c.body.text, "text")!)));

export const undoRoute =(c: Ctx) => afterWrite(c.root, () => asUserError(() => undoLast(c.root)));

/** Save an edited body. `base` must be the hash the phone read, else 409 with the note as it is now. */
function editTags(root: string, raw: unknown): string[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw) || !raw.every((x) => typeof x === "string")) throw new HttpError(400, `"tags" must be a list of text.`);
  const allowed = loadSchema(root).tags;
  const unknown = raw.find((t) => !allowed.has(t));
  if (unknown !== undefined) throw new HttpError(400, `Unknown tag "${unknown}". Add it to .schema/tags.yaml first.`);
  return [...new Set(raw)];
}

function withTags(meta: Meta, tags: string[] | undefined): Meta {
  if (tags === undefined) return meta;
  const next: Meta = { ...meta, tags };
  if (!tags.length) delete next.tags;
  return next;
}

function editTitle(raw: unknown, current: Note): string | undefined {
  const title = text(raw, "title", false)?.trim().replace(/\s+/g, " ");
  if (title === undefined) return undefined;
  if (typeOf(current) !== "Journal") throw new HttpError(400, "Only a journal title can be changed here.");
  if (title.length > 120) throw new HttpError(400, `"title" must be 1 to 120 characters.`);
  return title;
}

function editStatus(root: string, raw: unknown, current: Note): string | undefined {
  const status = text(raw, "status", false)?.trim();
  if (status === undefined) return undefined;
  const allowed = statusesFor(typeOf(current), loadSchema(root));
  if (!allowed.includes(status)) throw new HttpError(400, `"status" must be one of: ${allowed.join(", ")}.`);
  return status;
}

export function editNote(c: Ctx, rawPath: string) {
  const path = safeNotePath(rawPath, true);
  const base = text(c.body.base, "base")!;
  const tags = editTags(c.root, c.body.tags);
  const current = existingNote(c.root, path);
  const body = text(c.body.body, "body", false) ?? current.body;
  const title = editTitle(c.body.title, current);
  const status = editStatus(c.root, c.body.status, current);
  if (hash(fileText(c.root, path)) !== base) throw new HttpError(409, "This note changed since you read it.", { current: fullNoteJson(c.root, loadAll(c.root), current) });
  const meta = { ...withTags(current.meta as Meta, tags), ...(title && { title }), ...(status && { status }) };
  const check = parse(dump(meta, body));
  if (check.error) throw new HttpError(400, check.error);
  if (dump(meta, body) !== dump(current.meta as Meta, current.body)) afterWrite(c.root, () => change(c.root, path, `edit: ${path}`, () => void writeNote(c.root, path, meta, body)));
  return fullNoteJson(c.root, loadAll(c.root), readNote(c.root, path));
}
