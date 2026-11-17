// The owner's own picks at add: a relation (About what?), a person, or a tag.
// DECISION: any one of them counts as sorted. The text goes straight to that subject, and no capture is written.
// A tag goes to the area note with that slug or tag. A tag that is not an area goes to General.

import { DIRS, folderOf, type Note, tagsOf, typeOf } from "../core/notes.ts";

export interface Picks {
  about?: string[];
  people?: string[];
  tags?: string[];
}

export const GENERAL = "areas/general.md";

const textList = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);

const isFiled =(n: Note | undefined): n is Note => !!n && folderOf(n) !== "inbox" && folderOf(n) !== DIRS.archive && typeOf(n) !== "Capture";

function tagHome(notes: Note[], tags: string[]): Note | undefined {
  if (!tags.length) return undefined;
  const areas = notes.filter((n) => typeOf(n) === "Area" && isFiled(n));
  for (const tag of tags) {
    const hit = areas.find((a) => a.path === `areas/${tag}.md`) ?? areas.find((a) => tagsOf(a).includes(tag));
    if (hit) return hit;
  }
  return areas.find((a) => a.path === GENERAL);
}

/** Where the picks send the text, and the other picks as `· with` (people) and `· re` (subjects). */
export function pickedHome(notes: Note[], p: Picks): { target?: Note; with: string[]; re: string[] } {
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const about = textList(p.about).map((x) => byPath.get(x)).filter(isFiled);
  const people = textList(p.people).map((x) => byPath.get(x)).filter(isFiled).filter((n) => typeOf(n) === "Person");
  const target = about[0] ?? people[0] ?? tagHome(notes, textList(p.tags));
  const others = (list: Note[]) => list.filter((n) => n !== target).map((n) => n.path);
  return { target, with: others(people), re: others(about) };
}
