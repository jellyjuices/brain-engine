import type { AgentTokenResponse, RevokeResponse } from "../api-types.ts";
import { agentTokenPath, issueAgentToken, revokeAgentToken } from "../server-agent.ts";
import type { Ctx } from "../server-context.ts";

export function newAgentToken(c: Ctx): AgentTokenResponse {
  const path = c.agentFile ?? agentTokenPath();
  return { token: issueAgentToken(path), path };
}

export const revokeAgent = (c: Ctx): RevokeResponse => ({ revoked: revokeAgentToken(c.agentFile ?? agentTokenPath()) });
