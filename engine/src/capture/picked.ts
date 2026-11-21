import { DIRS, folderOf, type Note, tagsOf, typeOf } from "../core/notes.ts";

export interface Picks {
  about?: string[];
  people?: string[];
  tags?: string[];
}

export const GENERAL = "areas/general.md";

const textList = (x: unknown): string[] => (Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : []);

const isFiled =(n: Note | undefined): n is Note => !!n && folderOf(n) !== "inbox" && folderOf(n) !== DIRS.archive && typeOf(n) !== "Capture";

const areasOf = (notes: Note[]) => notes.filter((n) => typeOf(n) === "Area" && isFiled(n));

export function areaForTag(notes: Note[], tag: string): Note | undefined {
  const areas = areasOf(notes);
  return areas.find((a) => a.path === `areas/${tag}.md`) ?? areas.find((a) => tagsOf(a).includes(tag));
}

function tagHome(notes: Note[], tags: string[]): Note | undefined {
  if (!tags.length) return undefined;
  for (const tag of tags) {
    const hit = areaForTag(notes, tag);
    if (hit) return hit;
  }
  return areasOf(notes).find((a) => a.path === GENERAL);
}

export function pickedHome(notes: Note[], p: Picks): { target?: Note; with: string[]; re: string[] } {
  const byPath = new Map(notes.map((n) => [n.path, n]));
  const about = textList(p.about).map((x) => byPath.get(x)).filter(isFiled);
  const people = textList(p.people).map((x) => byPath.get(x)).filter(isFiled).filter((n) => typeOf(n) === "Person");
  const target = about[0] ?? people[0] ?? tagHome(notes, textList(p.tags));
  const others = (list: Note[]) => list.filter((n) => n !== target).map((n) => n.path);
  return { target, with: others(people), re: others(about) };
}
