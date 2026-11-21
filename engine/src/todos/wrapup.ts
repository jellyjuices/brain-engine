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

export function dropWith(root: string, ref: string, why?: string): ReturnType<typeof drop> {
  return drop(root, ref, { note: why });
}
