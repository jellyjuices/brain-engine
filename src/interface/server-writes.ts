import { applyTriage, newNote } from "../capture/actions.ts";
import { sortCapture, whenFrom } from "../capture/file.ts";
import { dump, type Meta, parse } from "../core/notes.ts";
import { loadAll, readNote, writeNote } from "../core/files.ts";
import { loadSchema } from "../core/schema.ts";
import { move } from "../todos/verbs.ts";
import { change, undo } from "../todos/undo.ts";
import { doneWith, dropWith } from "../todos/wrapup.ts";
import { HttpError, MAX_FILE } from "./server-auth.ts";
import { afterWrite, asUserError, type Ctx, existingNote, fileText, fullNoteJson, hash, safeNotePath, text } from "./server-context.ts";

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

/** A longer note (type Daily) in journal/. It is tied to a date, and to an event or person when `about` is set. The same title and text returns that note, so a retry makes no copy. */
export function addJournal(c: Ctx) {
  const date = text(c.body.date, "date")!.trim();
  if (!BIRTHDAY.test(date) || Number.isNaN(Date.parse(date))) throw new HttpError(400, `"date" must look like 2026-11-05.`);
  const body = text(c.body.text, "text")!;
  if (!body.trim()) throw new HttpError(400, `Missing "text".`);
  if (Buffer.byteLength(body) > MAX_FILE) throw new HttpError(413, "A journal note can be 60 KB at most.");
  const aboutPath = text(c.body.about, "about", false);
  const about = aboutPath ? existingNote(c.root, safeNotePath(aboutPath, true)) : undefined;
  const title = (text(c.body.title, "title", false)?.trim().replace(/\s+/g, " ") || `Journal ${date}`).slice(0, 120);
  const same = loadAll(c.root).find((n) => n.meta.type === "Daily" && String(n.meta.title ?? "") === title && n.body.includes(body.trim()));
  if (same) return { path: same.path, created: false };
  const made = afterWrite(c.root, () => {
    const note = newNote(c.root, "Daily", title, { description: `Journal note for ${date}.`, date });
    const related = about ? `\n# Related\n\n- [${String(about.meta.title ?? about.path)}](../${about.path}) · about\n` : "";
    return writeNote(c.root, note.path, note.meta, `${body.trimEnd()}\n${related}`);
  });
  return { path: made.path, created: true };
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
export function addFile(c: Ctx) {
  const title = text(c.body.title, "title")!.trim().replace(/\s+/g, " ");
  if (!title) throw new HttpError(400, `Missing "title".`);
  if (title.length > 120) throw new HttpError(400, "A title can be 120 characters at most.");
  const body = text(c.body.text, "text")!;
  if (Buffer.byteLength(body) > MAX_FILE) throw new HttpError(413, "A file can be 60 KB at most.");
  const same = loadAll(c.root).find((n) => n.meta.type === "Note" && String(n.meta.title ?? "") === title && n.body.trim() === body.trim());
  if (same) return { path: same.path, created: false };
  const made = afterWrite(c.root, () => {
    const note = newNote(c.root, "Note", title, { description: `File added from the phone: ${title}`.slice(0, 150), tags: ["reference"] });
    return writeNote(c.root, note.path, note.meta, `${body.trimEnd()}\n`);
  });
  return { path: made.path, created: true };
}

function inboxPath(raw: unknown, name: string): string {
  const path = safeNotePath(text(raw, name)!, true);
  if (!path.startsWith("inbox/")) throw new HttpError(400, "That is not in the inbox.");
  return path;
}

/** File one inbox item into a subject note with a When, then archive the item. */
export const NO_SUBJECT_HOME = "areas/life-admin.md";

export function sortRoute(c: Ctx) {
  const path = inboxPath(c.body.path, "path");
  const picked = typeof c.body.into === "string" ? c.body.into.trim() : "";
  const into = picked ? safeNotePath(picked, true) : NO_SUBJECT_HOME;
  const when = whenFrom(text(c.body.when, "when")!);
  if (!when) throw new HttpError(400, `"when" is not a day I know.`);
  existingNote(c.root, path);
  existingNote(c.root, into);
  return afterWrite(c.root, () => asUserError(() => sortCapture(c.root, loadAll(c.root), path, into, when)));
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

export const dropRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => dropWith(c.root, text(c.body.ref, "ref")!, text(c.body.why, "why", false))));

export const undoRoute = (c: Ctx) => afterWrite(c.root, () => asUserError(() => undo(c.root)));

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

export function editNote(c: Ctx, rawPath: string) {
  const path = safeNotePath(rawPath, true);
  const body = text(c.body.body, "body")!;
  const base = text(c.body.base, "base")!;
  const tags = editTags(c.root, c.body.tags);
  const current = existingNote(c.root, path);
  if (hash(fileText(c.root, path)) !== base) throw new HttpError(409, "This note changed since you read it.", { current: fullNoteJson(c.root, loadAll(c.root), current) });
  const meta = withTags(current.meta as Meta, tags);
  const check = parse(dump(meta, body));
  if (check.error) throw new HttpError(400, check.error);
  if (dump(meta, body) !== dump(current.meta as Meta, current.body)) afterWrite(c.root, () => change(c.root, path, `edit: ${path}`, () => void writeNote(c.root, path, meta, body)));
  return fullNoteJson(c.root, loadAll(c.root), readNote(c.root, path));
}
