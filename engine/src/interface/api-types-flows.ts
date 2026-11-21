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
  fields?: Record<string, string | string[]>;
  areas?: string[];
  parent?: string;
  sections?: Record<string, string[]>;
  relations?: { to: string; role?: string; time?: string }[];
  todos?: (string | { text: string; when?: string; toward?: string })[];
}
