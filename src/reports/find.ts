import { localDate, type Note, slugOf, summary, type Summary, titleOf } from "../core/notes.ts";

export function findNote(notes: Note[], query: string): Note | undefined {
  const needle = query.toLowerCase().replace(/\.md$/, "");
  return (
    notes.find((n) => n.path.toLowerCase().replace(/\.md$/, "") === needle) ??
    notes.find((n) => slugOf(n).toLowerCase() === needle) ??
    notes.find((n) => titleOf(n).toLowerCase() === needle) ??
    notes.find((n) => titleOf(n).toLowerCase().includes(needle))
  );
}

export function backlinks(notes: Note[], path: string): Summary[] {
  return notes.filter((n) => n.path !== path && n.links.includes(path)).map(summary);
}

export { localDate };
