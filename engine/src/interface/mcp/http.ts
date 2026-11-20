// `POST /mcp`: the MCP server for agents. Only the agent token gets in, as `Authorization: Bearer <token>`.
// DECISION: the owner token does not open /mcp. An agent is always the "agent" caller, so owner-only routes stay
// shut and the agent rate limit always applies. It is the same RateLimit object the /api/ routes use.

import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { readAgentToken, type RateLimit } from "../server-agent.ts";
import { HttpError, isAuthorized } from "../server-auth.ts";
import { readBody } from "../server-context.ts";
import { dispatch } from "./rpc.ts";

const MCP_PATH = "/mcp";
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const VERSION = (JSON.parse(readFileSync(new URL("../../../../package.json", import.meta.url), "utf8")) as { version: string }).version;

export interface McpDeps {
  root: string;
  agentFile: string;
  limit: RateLimit;
}

export const isMcp = (rawUrl: string | undefined) => new URL(rawUrl ?? "/", "http://localhost").pathname === MCP_PATH;

function reply(res: ServerResponse, status: number, body?: unknown, headers: Record<string, string> = {}): void {
  if (body === undefined) {
    res.writeHead(status, { "Cache-Control": "no-store", ...headers });
    return void res.end();
  }
  const data = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(data), ...headers });
  res.end(data);
}

const rpcError = (code: number, message: string, data?: unknown) => ({ jsonrpc: "2.0", error: { code, message, ...(data !== undefined && { data }) } });

/** A browser page on another site must not reach this server (DNS rebinding). Agents send no Origin. */
function badOrigin(req: IncomingMessage): boolean {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return !LOOPBACK.has(new URL(origin).hostname);
  } catch {
    return true;
  }
}

function header(req: IncomingMessage): (name: string) => string | undefined {
  return (name) => {
    const v = req.headers[name.toLowerCase()];
    return Array.isArray(v) ? v[0] : v;
  };
}

export async function handleMcp(req: IncomingMessage, res: ServerResponse, deps: McpDeps): Promise<void> {
  if (badOrigin(req)) return reply(res, 403, rpcError(-32600, "That origin may not call this server."));
  const agent = readAgentToken(deps.agentFile);
  if (!agent || !isAuthorized(req, agent)) return reply(res, 401, rpcError(-32600, "An agent token is needed."), { "WWW-Authenticate": "Bearer" });
  if (req.method !== "POST") return reply(res, 405, rpcError(-32600, "Use POST."), { Allow: "POST" });
  const wait = deps.limit.take();
  if (wait) return reply(res, 429, rpcError(-32600, "Too many calls. Wait a little and try again.", { retry_after: wait }), { "Retry-After": String(wait) });
  let msg: unknown;
  try {
    msg = await readBody(req);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 400;
    return reply(res, status, rpcError(-32700, (e as Error).message || "Parse error."));
  }
  const out = await dispatch({ root: deps.root, agentFile: deps.agentFile, version: VERSION, header: header(req) }, msg);
  reply(res, out.status, out.body);
}
