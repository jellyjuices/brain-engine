import notesJson from "../../../../../engine/test/fixtures/t9/notes.json";
import questionsJson from "../../../../../engine/test/fixtures/t9/questions.json";
import type { StoredNote } from "@/lib/notes/model.ts";
import { note } from "../../helpers.ts";

export interface Question {
  group: "words" | "typo" | "part" | "spanish" | "japanese" | "meaning";
  q: string;
  want: string[];
}

export const questions = questionsJson as Question[];

function metaOf(lines: string[]): Record<string, string> {
  return Object.fromEntries(
    lines.map((line) => {
      const at = line.indexOf(":");
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    }),
  );
}

function toNote([path, lines]: [string, string[]]): StoredNote {
  const end = lines.indexOf("---");
  const meta = metaOf(lines.slice(0, end));
  return note(path, lines.slice(end + 1).join("\n"), {
    type: meta.type,
    title: meta.title ?? path,
    description: meta.description ?? "",
    meta,
  });
}

export function t9Notes(): StoredNote[] {
  return Object.entries(notesJson as Record<string, string[]>).map(toNote);
}
