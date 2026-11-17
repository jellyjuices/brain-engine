import { bestHome, fileInto, splitPrefix, subjectsNamed, type When, whenFrom } from "../capture/file.ts";
import { titleOf, typeOf } from "../core/notes.ts";
import { loadAll, readNote } from "../core/files.ts";
import { findNote } from "../reports/find.ts";
import { change } from "../todos/undo.ts";
import { record } from "./subjects.ts";

/**
 * File an intake to-do straight into its subject note with When and About what. Never the inbox.
 * `when`: today, tomorrow, a weekday, a date, someday, waiting or note (or a "tomorrow:" prefix on the text).
 */
export function fileIntakeTodo(root: string, input: string, o: { when?: string; about?: string } = {}): { into: string; as: string; text: string } {
  const notes = loadAll(root);
  const split = splitPrefix(input);
  const when: When | undefined = (o.when ? whenFrom(o.when) : undefined) ?? split.when;
  if (!when) throw new Error("When? Say today, tomorrow, a date, someday, waiting on someone, or note.");
  const text = split.text;
  const target = o.about ? findNote(notes, o.about) : undefined;
  if (o.about && !target) throw new Error(`No note matches "${o.about}". About what?`);
  const into = target?.path ?? bestHome(notes, text).into;
  if (!into) throw new Error("About what? Name the note this belongs in.");
  const hits = subjectsNamed(notes, text).filter((n) => n.path !== into);
  const people = hits.filter((n) => typeOf(n) === "Person").map((n) => n.path);
  const re = hits.filter((n) => typeOf(n) !== "Person").map((n) => n.path);
  let as = "to-do";
  change(root, into, `intake: ${when.kind === "note" ? "note" : "to-do"} added to ${into}: ${text}`, () => {
    as = fileInto(root, notes, into, text, when, { with: people, re });
  });
  record(root, { kind: "todo", subject: titleOf(readNote(root, into)), text, path: into });
  return { into, as, text };
}
