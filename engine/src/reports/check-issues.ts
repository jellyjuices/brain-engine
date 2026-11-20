import { existsSync } from "node:fs";
import { join } from "node:path";
import { folderOf, titleOf, type Note } from "../core/notes.ts";
import { type Issue, loadSchema, type Schema, validate } from "../core/schema.ts";
import { goalTreeIssues } from "../core/schema-kinds.ts";
import { MAX_WARN_LINES, type Mention, mentionedTwice, unlinkedMentions } from "./mentions.ts";

type Found = [string, Issue];

function noteIssues(root: string, note: Note, schema: Schema): Found[] {
  const broken = note.links.filter((t) => t.endsWith(".md") && !existsSync(join(root, t)));
  return [...validate(note, schema).map((i): Found => [note.path, i]), ...broken.map((t): Found => [note.path, { level: "error", message: `broken link to ${t}` }])];
}

function sameTitleIssues(notes: Note[]): Found[] {
  const byTitle = new Map<string, string[]>();
  for (const note of notes.filter((x) => folderOf(x) !== "inbox" && x.meta.title)) {
    const title = titleOf(note).toLowerCase();
    byTitle.set(title, [...(byTitle.get(title) ?? []), note.path]);
  }
  const dupes = [...byTitle.values()].filter((paths) => paths.length > 1);
  return dupes.flatMap((paths) => paths.map((path): Found => [path, { level: "warn", message: `same title as ${paths.filter((x) => x !== path).join(", ")}` }]));
}

function mentionMessage(m: Mention): string {
  const person = m.suggest === "Person";
  return `${m.name} shows in ${m.notes.length} notes, no note. Make ${person ? "a Person" : "one"}?${person ? "" : " Who, where, doing, have, or know?"}`;
}

export function allIssues(root: string, notes: Note[]): Found[] {
  const schema = loadSchema(root);
  return [
    ...notes.flatMap((note) => noteIssues(root, note, schema)),
    ...sameTitleIssues(notes),
    ...goalTreeIssues(root, notes),
    ...unlinkedMentions(notes).map(([p, message]): Found => [p, { level: "warn", message }]),
    ...mentionedTwice(notes).slice(0, MAX_WARN_LINES).map((m): Found => [m.notes[0], { level: "warn", message: mentionMessage(m) }]),
  ];
}
