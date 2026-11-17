// What happens after the owner finishes or drops a to-do: "What happened?", "Follow-up?" and "Why?".
//
// The write logic takes the answers as arguments, so tests and the phone API call it without a terminal.
// The prompts are the only part that needs a terminal. One change, one undo: the tick, the note line and
// the follow-up all log as a single entry.
//
// DECISION: a follow-up with no When prefix is a to-do for today. The owner just said they need to do it, so it
// should show up, not vanish into someday. Prefixes work as in `brain add` ("tomorrow: call Dr").

import { posix } from "node:path";
import { type Note, titleOf, typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { fileInto, splitPrefix, subjectsNamed, type When } from "../capture/file.ts";
import { done, drop } from "./verbs.ts";
import { type Item, resolve } from "./day-list.ts";

export interface DoneAnswers {
  happened?: string;
  follow_up?: string;
}

export interface FollowUp {
  into: string;
  as: string;
  text: string;
}

/** Tick a to-do with the answers. Blank answers are skipped. */
export function doneWith(root: string, ref: string, a: DoneAnswers = {}): ReturnType<typeof done> & { followUp?: FollowUp } {
  const item = resolve(root, ref);
  const follow = a.follow_up?.trim();
  let followUp: FollowUp | undefined;
  const result = done(root, ref, {
    note: a.happened,
    also: follow
      ? () => {
          const { when, text } = splitPrefix(follow);
          const w: When = when ?? { kind: "today" };
          const notes = loadAll(root);
          const hits = subjectsNamed(notes, text).filter((n) => n.path !== item.path);
          const people = hits.filter((n) => typeOf(n) === "Person").map((n) => n.path);
          const re = hits.filter((n) => typeOf(n) !== "Person").map((n) => n.path);
          const as = fileInto(root, notes, item.path, text, w, { with: people, re });
          followUp = { into: item.path, as, text };
        }
      : undefined,
  });
  return { ...result, ...(followUp && { followUp }) };
}

/** Drop a to-do with the reason. A blank reason is skipped. */
export function dropWith(root: string, ref: string, why?: string): ReturnType<typeof drop> {
  return drop(root, ref, { note: why });
}

/** Subjects whose full title shows in the text, not yet linked. Exact title only, so a nickname never links. */
export function namedSubjects(notes: Note[], text: string, fromPath: string): Note[] {
  return subjectsNamed(notes, text)
    .filter((n) => n.path !== fromPath && !text.includes(`](${posix.relative(posix.dirname(fromPath), n.path)})`))
    .filter((n) => new RegExp(`(^|[^\\p{L}\\p{N}])${titleOf(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(text));
}

/** Turn the first mention of a subject into a relative link. */
export function linkText(text: string, from: string, subject: Note): string {
  const title = titleOf(subject);
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[^\\p{L}\\p{N}])`, "iu");
  return text.replace(re, (_m, pre: string, name: string) => `${pre}[${name}](${posix.relative(posix.dirname(from), subject.path)})`);
}

/** Ask the questions in a terminal. Returns the answers, with names the owner confirmed turned into links. */
async function askLinks(root: string, text: string | undefined, from: string): Promise<string | undefined> {
  if (!text) return text;
  const p = await import("@clack/prompts");
  let out = text;
  for (const note of namedSubjects(loadAll(root), text, from)) {
    const yes = await p.confirm({ message: `Link ${titleOf(note)}?`, initialValue: true });
    if (yes === true) out = linkText(out, from, note);
  }
  return out;
}

async function ask(message: string): Promise<string | undefined> {
  const p = await import("@clack/prompts");
  const answer = await p.text({ message });
  return p.isCancel(answer) ? undefined : (answer as string).trim() || undefined;
}

/** The terminal version of done: resolve, ask, write once. */
export async function doneInTerminal(root: string, ref: string): Promise<ReturnType<typeof doneWith>> {
  const item: Item = resolve(root, ref);
  const happened = await askLinks(root, await ask("What happened? (Enter to skip)"), item.path);
  const follow_up = await ask("Follow-up? (Enter to skip)");
  return doneWith(root, ref, { happened, follow_up });
}

/** The terminal version of drop. */
export async function dropInTerminal(root: string, ref: string): Promise<ReturnType<typeof drop>> {
  const item: Item = resolve(root, ref);
  const why = await askLinks(root, await ask("Why? (Enter to skip)"), item.path);
  return dropWith(root, ref, why);
}

