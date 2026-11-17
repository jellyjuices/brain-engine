// Shapes for resumable flows (drafts) and the agent token. api-types.ts re-exports them, so import from there.

export const DRAFT_KINDS = ["add", "sort", "builder"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];

export interface Draft {
  id: string;
  kind: DraftKind;
  step?: string;
  data: Record<string, unknown>;
  created: string;
  updated: string;
}

export interface SaveDraftRequest {
  id?: string;
  kind: DraftKind;
  step?: string;
  data: Record<string, unknown>;
}

export interface DraftsResponse {
  drafts: Draft[];
}

export interface DeletedResponse {
  deleted: boolean;
}

export interface AgentTokenResponse {
  token: string;
  path: string;
}

export interface RevokeResponse {
  revoked: boolean;
}

export interface MakeNoteRequest {
  type: string;
  title: string;
  description?: string;
  draft_id?: string;
  /** why, when, date, with, decide_by, subjects, birthday, from, renews or status. */
  fields?: Record<string, string | string[]>;
  /** Area slugs. */
  areas?: string[];
  /** A goal path or slug: this goal is its subgoal. */
  parent?: string;
  /** Lines under headings, like { "# Targets": ["- [ ] Run 5 km"] }. */
  sections?: Record<string, string[]>;
  /** Links written in the new note, under the heading for the target's type. */
  relations?: { to: string; role?: string; time?: string }[];
  /** To-dos written under # To-dos. A text, or an object with a When word and a goal it is toward. */
  todos?: (string | { text: string; when?: string; toward?: string })[];
}
