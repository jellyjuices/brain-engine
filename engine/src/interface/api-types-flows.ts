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
