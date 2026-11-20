import { isLive, type StoredNote } from "./model.ts";
import { splitWhen } from "./when.ts";

export function shareToText(params: URLSearchParams): string {
  const parts = ["title", "text", "url"].map((k) => params.get(k)?.trim() ?? "").filter(Boolean);
  return parts.filter((p, i) => parts.indexOf(p) === i).join("\n");
}

export function setWhenWord(text: string, word: string): string {
  const body = splitWhen(text).when
    ? text.replace(/^\s*[\p{L}\d-]+:\s+/u, "")
    : text.replace(/^\s+/, "");
  return word ? `${word}: ${body}` : body;
}

export function tagsInUse(notes: StoredNote[]): string[] {
  const n = new Map<string, number>();
  for (const note of notes) for (const t of note.tags) n.set(t, (n.get(t) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([t]) => t);
}

export function isFiled(n: StoredNote): boolean {
  return isLive(n) && !n.path.startsWith("inbox/") && n.type !== "Capture";
}

export function inboxItems(notes: StoredNote[]): StoredNote[] {
  return notes
    .filter((n) => isLive(n) && n.path.startsWith("inbox/"))
    .sort((a, b) => b.modified.localeCompare(a.modified));
}

export function inboxText(n: StoredNote): string {
  const text = n.body
    .replace(/^#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || n.title;
}

export function mentionName(n: { title: string; type?: string }): string {
  return n.type === "Person" ? n.title.split(/[\s,]+/)[0]! : n.title.split(",")[0]!;
}
