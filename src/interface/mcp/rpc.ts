// JSON-RPC for MCP over Streamable HTTP, stateless. Dual-era, per the 2026-07-28 spec:
//   - modern: every request carries its version in `_meta` and mirrors it in headers; no handshake.
//   - legacy (2025-11-25 and earlier): `initialize`, then plain requests. No session id is minted.
// DECISION: legacy stays because most agent clients still open with `initialize` today.

import { HttpError } from "../server-auth.ts";
import type { Json } from "./schema.ts";
import { capText, findTool, runTool, TOOLS } from "./tools.ts";

export const MODERN = "2026-07-28";
export const LEGACY = ["2025-11-25", "2025-06-18", "2025-03-26"];
const META = "io.modelcontextprotocol/";
const INSTRUCTIONS = "The owner's second brain: Markdown notes and to-dos. Find before you add. Every write is logged, and undo reverses the last one.";

export interface Reply {
  status: number;
  body?: Json;
}

export interface RpcCtx {
  root: string;
  agentFile: string;
  version: string;
  header: (name: string) => string | undefined;
}

type Id = string | number | undefined;
const fail = (status: number, id: Id, code: number, message: string, data?: unknown): Reply => ({ status, body: { jsonrpc: "2.0", ...(id !== undefined && { id }), error: { code, message, ...(data !== undefined && { data }) } } });
const isObj = (x: unknown): x is Json => !!x && typeof x === "object" && !Array.isArray(x);

/** `Mcp-Name` may come as `=?base64?...?=` when the name is not plain ASCII. */
function decodeName(v: string | undefined): string | undefined {
  const m = v && /^=\?base64\?(.*)\?=$/.exec(v);
  return m ? Buffer.from(m[1], "base64").toString("utf8") : v;
}

/** A modern request's header and `_meta` checks. Undefined when all is well. */
function checkModern(c: RpcCtx, id: Id, method: string, params: Json, meta: Json): Reply | undefined {
  const version = meta[`${META}protocolVersion`];
  if (version !== MODERN) return fail(400, id, -32022, "Unsupported protocol version", { supported: [MODERN, ...LEGACY], requested: version });
  if (!isObj(meta[`${META}clientCapabilities`])) return fail(400, id, -32602, `Missing _meta "${META}clientCapabilities".`);
  if (c.header("mcp-protocol-version") !== version) return fail(400, id, -32020, "Header mismatch: MCP-Protocol-Version does not match _meta.");
  if (c.header("mcp-method") !== method) return fail(400, id, -32020, "Header mismatch: Mcp-Method does not match the method.");
  if (method === "tools/call" && decodeName(c.header("mcp-name")) !== params.name) return fail(400, id, -32020, "Header mismatch: Mcp-Name does not match params.name.");
  return undefined;
}

async function callTool(c: RpcCtx, id: Id, params: Json): Promise<Json | Reply> {
  const tool = typeof params.name === "string" ? findTool(params.name) : undefined;
  if (!tool) return fail(200, id, -32602, `Unknown tool: ${String(params.name)}`);
  const args = params.arguments ?? {};
  if (!isObj(args)) return fail(200, id, -32602, "arguments must be an object.");
  try {
    return { content: [{ type: "text", text: capText(await runTool(tool, args, c.root, c.agentFile)) }], isError: false };
  } catch (e) {
    const err = e instanceof HttpError ? { error: e.message, status: e.status, ...e.extra } : { error: (e as Error).message || "Something went wrong.", status: 500 };
    return { content: [{ type: "text", text: capText(err) }], isError: true };
  }
}

function initialize(c: RpcCtx, params: Json): Json {
  const asked = typeof params.protocolVersion === "string" ? params.protocolVersion : "";
  return { protocolVersion: LEGACY.includes(asked) ? asked : LEGACY[0], capabilities: { tools: {} }, serverInfo: { name: "brain", version: c.version }, instructions: INSTRUCTIONS };
}

/** One JSON-RPC message in, one reply out. A notification gets 202 with no body. */
export async function dispatch(c: RpcCtx, msg: unknown): Promise<Reply> {
  if (!isObj(msg) || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return fail(400, undefined, -32600, "Invalid request: send one JSON-RPC 2.0 object.");
  if (!("id" in msg)) return { status: 202 };
  const id = msg.id;
  if (typeof id !== "string" && typeof id !== "number") return fail(400, undefined, -32600, "Invalid request: id must be text or a number.");
  const method = msg.method;
  const params = isObj(msg.params) ? msg.params : {};
  const meta = isObj(params._meta) ? params._meta : {};
  const modern = `${META}protocolVersion` in meta || c.header("mcp-protocol-version") === MODERN;
  if (modern) {
    const bad = checkModern(c, id, method, params, meta);
    if (bad) return bad;
  } else if (method !== "initialize") {
    const v = c.header("mcp-protocol-version");
    if (v && !LEGACY.includes(v)) return fail(400, id, -32022, "Unsupported protocol version", { supported: [MODERN, ...LEGACY], requested: v });
  }
  let result: Json | Reply;
  if (method === "initialize" && !modern) result = initialize(c, params);
  else if (method === "ping") result = {};
  else if (method === "server/discover") result = { supportedVersions: [MODERN, ...LEGACY], capabilities: { tools: {} }, instructions: INSTRUCTIONS };
  else if (method === "tools/list") result = { tools: TOOLS.map((t) => t.def) };
  else if (method === "tools/call") result = await callTool(c, id, params);
  else return fail(modern ? 404 : 200, id, -32601, `Method not found: ${method}`);
  if ("status" in result && typeof result.status === "number" && "body" in result) return result as Reply;
  const extra = modern ? { resultType: "complete", _meta: { [`${META}serverInfo`]: { name: "brain", version: c.version } } } : {};
  return { status: 200, body: { jsonrpc: "2.0", id, result: { ...result, ...extra } } };
}
