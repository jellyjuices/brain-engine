import type { StoredNote } from "./model.ts";

export interface Insertion {
  text: string;
  ownLine?: boolean;
}

export function relativePath(from: string, to: string): string {
  const fromDirs = from.split("/").slice(0, -1);
  const toParts = to.split("/");
  let shared = 0;
  while (
    shared < fromDirs.length &&
    shared < toParts.length - 1 &&
    fromDirs[shared] === toParts[shared]
  )
    shared++;
  return [...Array<string>(fromDirs.length - shared).fill(".."), ...toParts.slice(shared)].join(
    "/",
  );
}

export function referenceText(from: string, target: StoredNote): Insertion {
  return { text: `[${target.title}](${relativePath(from, target.path)})` };
}

export function dateText(iso: string): Insertion {
  return { text: iso };
}

export function todoText(): Insertion {
  return { text: "- [ ] ", ownLine: true };
}

export function insertAt(value: string, start: number, end: number, add: Insertion) {
  const before = value.slice(0, start);
  const lead = add.ownLine && before && !before.endsWith("\n") ? "\n" : "";
  const text = lead + add.text;
  return { value: before + text + value.slice(end), caret: start + text.length };
}
