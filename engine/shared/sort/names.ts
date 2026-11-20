import type { SortSubject } from "./types.ts";

const TYPE_RANK = ["Event", "Person", "Group", "Place", "Thing", "Topic", "Project", "Area"];

const MIN_NAME = 2;

export function namesOf(subject: SortSubject): string[] {
  const names = [subject.title, subject.title.split(",")[0] ?? "", ...subject.aliases];
  if (subject.type === "Person") names.push(subject.title.split(/[\s,]+/)[0] ?? "");
  const clean = names.map((name) => name.trim().toLowerCase()).filter((name) => name.length >= MIN_NAME);
  return [...new Set(clean)];
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function says(text: string, name: string): boolean {
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escape(name)}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

const rankOf = (subject: SortSubject) => TYPE_RANK.indexOf(subject.type);

export function subjectsNamed<S extends SortSubject>(subjects: readonly S[], text: string): S[] {
  return subjects
    .filter((subject) => rankOf(subject) >= 0)
    .filter((subject) => namesOf(subject).some((name) => says(text, name)))
    .sort((a, b) => rankOf(a) - rankOf(b) || b.title.length - a.title.length);
}
