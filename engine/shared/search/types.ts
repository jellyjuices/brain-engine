export const ENTRY_KINDS = ["card", "section", "todo", "dated"] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

export interface Entry {
  id: string;
  hash: string;
  kind: EntryKind;
  subject: string;
  title: string;
  names: string[];
  date: string | null;
  done: boolean | null;
  line: number;
  text: string;
  embedText: string;
}

export interface NoteHead {
  title: string;
  description: string;
  names: string[];
  date: string | null;
  bodyStart: number;
}
