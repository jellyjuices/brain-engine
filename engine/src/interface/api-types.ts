// Request and response shapes for every `brain serve` route. The MCP layer imports these: one tool per route.

import type { AnswerCard, FeedVector, FindHit, Meaning } from "../core/search.ts";
import type { Issue } from "../core/schema.ts";
import type { Relation } from "../core/relations.ts";
import type { Card } from "../reports/card.ts";
import type { DecisionView } from "../reports/decisions.ts";
import type { GoalRef, GoalView, TodoView } from "../../shared/todos/index.ts";
import type { Loop } from "../todos/todos.ts";
import type { fullNoteJson, noteJson } from "./server-context.ts";

export type Caller = "owner" | "agent";

export interface CheckIssue {
  path: string;
  level: Issue["level"];
  message: string;
}

/** Every write. `check` lists what the check found on the notes the write changed; it is left off when all is well. */
export interface WriteResult {
  check?: CheckIssue[];
}

export interface AddRequest {
  client_id: string;
  text: string;
  created_at?: string;
  into?: string;
  /** Note paths for About what. With kind "feeling": the side, in the owner's words. */
  about?: string[] | string;
  people?: string[];
  tags?: string[];
  by?: string;
  draft_id?: string;
  /** A When word or date, like tomorrow or 2026-11-20. The text stays as typed. */
  when?: string;
  /** "journal" writes the text whole as its own journal note, where it waits to be sorted. "fact" and "feeling" write one dated line into `into`. */
  kind?: "todo" | "journal" | "fact" | "feeling";
  /** A journal note's title. With none, the first words of the text. */
  title?: string;
}

export interface AddResponse extends WriteResult {
  saved: "filed" | "inbox" | "journal" | "skipped";
  path?: string;
  title?: string;
  client_id: string;
}

export interface DoneRequest {
  ref: string;
  happened?: string;
  follow_up?: string;
}

export interface MoveRequest {
  ref: string;
  when: string;
  who?: string;
  what?: string;
}

export interface DeleteTodoRequest {
  ref: string;
  why?: string;
}

export interface LineResponse extends WriteResult {
  line: string;
}

export interface UndoResponse extends WriteResult {
  msg: string;
  line: string;
}

export interface SortBitRequest {
  into: string;
  when: string;
  text?: string;
  with?: string[];
  re?: string[];
  kind?: "to-do" | "fact" | "feeling" | "decision";
  about?: string;
}

/** Either one `into` and `when` for the whole capture, or `bits` for a capture split into several lines. `path` may be a journal note. */
export interface SortRequest {
  path: string;
  into?: string;
  when?: string;
  bits?: SortBitRequest[];
  draft_id?: string;
}

export interface SortResponse extends WriteResult {
  into: string;
  filed: string[];
  /** A sorted capture is `deleted`; a sorted journal note is `kept` whole. */
  deleted?: string;
  kept?: string;
}

export interface UnsortedItem {
  path: string;
  created?: string;
  text: string;
  kind: "capture" | "journal";
  title?: string;
}

export interface UnsortedResponse {
  count: number;
  items: UnsortedItem[];
}

/** One hit per note, best first. `answer` is the top line, cited by path. `meaning` says how the meaning list ran. */
export interface FindResponse {
  card?: Card;
  answer: AnswerCard | null;
  meaning: Meaning;
  hits: FindHit[];
}

/** The changes feed. `vectors` holds only entries embedded since `since`, int8 in base64; a new `model` means fetch all again. */
export interface NotesSinceResponse {
  now: string;
  notes: ReturnType<typeof noteJson>[];
  model: string;
  vectors: FeedVector[];
}

export interface TodoRow extends Loop {
  ref: string;
}

export interface TodosResponse {
  view: TodoView;
  date: string;
  items: TodoRow[];
}

export interface GoalsResponse {
  goals: GoalRef[];
}

export type GoalResponse = GoalView;
export type DecisionResponse = DecisionView;

export type NoteResponse = ReturnType<typeof fullNoteJson>;

export interface MadeResponse extends WriteResult {
  path: string;
  created: boolean;
}

export interface DeleteNoteResponse extends WriteResult {
  path: string;
  archived: string;
}

export interface RelationsResponse {
  path: string;
  out: Relation[];
  in: Relation[];
}

export interface AddRelationRequest {
  from: string;
  to: string;
  role?: string;
  time?: string;
}

export interface AddRelationResponse extends WriteResult {
  from: string;
  to: string;
  line: string;
  created: boolean;
}

export interface LogRow {
  at: string;
  msg: string;
  id?: string;
  undoable: boolean;
}

export interface LogResponse {
  entries: LogRow[];
}

export * from "./api-types-flows.ts";
