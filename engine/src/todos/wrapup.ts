// What happens after the owner finishes or drops a to-do: "What happened?", "Follow-up?" and "Why?".
//
// The write logic takes the answers as arguments. One change, one undo: the tick, the note line and
// the follow-up all log as a single entry.
//
// DECISION: a follow-up with no When prefix is a to-do for today. The owner just said they need to do it, so it
// should show up, not vanish into someday. Prefixes work as in `brain add` ("tomorrow: call Dr").

import { typeOf } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { fileInto, splitPrefix, subjectsNamed, type When } from "../capture/file.ts";
import { done, drop } from "./verbs.ts";
import { resolve } from "./day-list.ts";

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
