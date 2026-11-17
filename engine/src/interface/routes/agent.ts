import type { AgentTokenResponse, RevokeResponse } from "../api-types.ts";
import { agentTokenPath, issueAgentToken, revokeAgentToken } from "../server-agent.ts";
import type { Ctx } from "../server-context.ts";

/** Owner only. Makes a new agent token and shows it once. Any old one stops working. */
export function newAgentToken(c: Ctx): AgentTokenResponse {
  const path = c.agentFile ?? agentTokenPath();
  return { token: issueAgentToken(path), path };
}

/** Owner only. Helpers get 401 from the next call. */
export const revokeAgent = (c: Ctx): RevokeResponse => ({ revoked: revokeAgentToken(c.agentFile ?? agentTokenPath()) });
