export interface InboxPayload {
  text: string;
  into?: string;
  tags?: string[];
}
export interface DonePayload {
  ref: string;
  happened?: string;
  follow_up?: string;
}
export interface MovePayload {
  ref: string;
  when: string;
  who?: string;
  what?: string;
}
export interface DropPayload {
  ref: string;
  why?: string;
}
export interface RefPayload {
  ref: string;
}
export interface TodoTextPayload {
  ref: string;
  text: string;
}
export interface EditPayload {
  path: string;
  body: string;
  base: string;
  tags?: string[];
}

export interface PersonPayload {
  name: string;
  birthday?: string;
}
export interface JournalPayload {
  title: string;
  text: string;
  date: string;
  about?: string;
}
export interface SubjectPayload {
  type: "Place" | "Thing";
  name: string;
}
export interface SortPayload {
  path: string;
  into: string;
  when: string;
}
export interface InboxDropPayload {
  path: string;
}
export interface FilePayload {
  title: string;
  text: string;
  asks?: string[];
}
export interface BirthdayPayload {
  path: string;
  birthday: string;
}

export interface IntakeSavePayload {
  lens: string;
  question: string;
  line: string;
  raw: string;
  by: "owner" | "gemini-nano";
}
export interface IntakeSkipPayload {
  question: string;
}
