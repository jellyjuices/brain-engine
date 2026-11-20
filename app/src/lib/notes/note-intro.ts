import { copy } from "@/content/index.ts";
import { str } from "./facts.ts";
import type { StoredNote } from "./model.ts";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type IntroNames = { title: string; nick: string; pronouns: string };

function otherName(title: string, isCapture: boolean, names: string[]): string {
  const lower = title.toLowerCase();
  const aka = names.find(
    (n) => n && n.toLowerCase() !== lower && !lower.startsWith(`${n.toLowerCase()} `),
  );
  return aka && !isCapture ? copy.common.goesBy(aka) : "";
}

export function introNames(note: StoredNote): IntroNames {
  const meta = note.meta ?? {};
  const nickname = str(meta.nickname);
  const isCapture = note.type === "Capture";
  const title = isCapture ? copy.inbox.capture : str(meta.full_name) || note.title;
  const nick = nickname ? `“${nickname}”` : otherName(title, isCapture, [note.title]);
  return { title, nick, pronouns: str(meta.pronouns) };
}

export type IntroDates = { date?: string; status: string; due?: string; with: string[] };

export function introDates(note: StoredNote): IntroDates {
  const meta = note.meta ?? {};
  const date = str(meta.date).slice(0, 10);
  const due = (note.due ?? str(meta.due)).slice(0, 10);
  const withList = (Array.isArray(meta.with) ? meta.with : [meta.with]).map(str).filter(Boolean);
  return {
    ...(ISO_DAY.test(date) && { date }),
    ...(!date && ISO_DAY.test(due) && { due }),
    status: str(meta.status),
    with: withList,
  };
}

export function hasDateFacts(d: IntroDates): boolean {
  return Boolean(d.date || d.due) || d.with.length > 0;
}
