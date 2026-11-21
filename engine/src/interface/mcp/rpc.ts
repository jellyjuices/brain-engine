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

function decodeName(v: string | undefined): string | undefined {
  const m = v && /^=\?base64\?(.*)\?=$/.exec(v);
  return m ? Buffer.from(m[1], "base64").toString("utf8") : v;
}

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

interface Call {
  c: RpcCtx;
  id: string | number;
  method: string;
  params: Json;
  modern: boolean;
}

type Method = (call: Call) => Json | Reply | Promise<Json | Reply>;

const METHODS: Record<string, Method> = {
  ping: () => ({}),
  "server/discover": () => ({ supportedVersions: [MODERN, ...LEGACY], capabilities: { tools: {} }, instructions: INSTRUCTIONS }),
  "tools/list": () => ({ tools: TOOLS.map((t) => t.def) }),
  "tools/call": ({ c, id, params }) => callTool(c, id, params),
};

function methodFor(call: Call): Method | undefined {
  if (call.method === "initialize") return call.modern ? undefined : ({ c, params }) => initialize(c, params);
  return Object.hasOwn(METHODS, call.method) ? METHODS[call.method] : undefined;
}

function checkLegacy(c: RpcCtx, id: Id, method: string): Reply | undefined {
  const v = c.header("mcp-protocol-version");
  if (method === "initialize" || !v || LEGACY.includes(v)) return undefined;
  return fail(400, id, -32022, "Unsupported protocol version", { supported: [MODERN, ...LEGACY], requested: v });
}

const isReply = (r: Json | Reply): r is Reply => "status" in r && typeof r.status === "number" && "body" in r;

function reply(call: Call, result: Json): Reply {
  const extra = call.modern ? { resultType: "complete", _meta: { [`${META}serverInfo`]: { name: "brain", version: call.c.version } } } : {};
  return { status: 200, body: { jsonrpc: "2.0", id: call.id, result: { ...result, ...extra } } };
}

function parseCall(c: RpcCtx, msg: Json & { method: string }): Call | Reply {
  const id = msg.id;
  if (typeof id !== "string" && typeof id !== "number") return fail(400, undefined, -32600, "Invalid request: id must be text or a number.");
  const params = isObj(msg.params) ? msg.params : {};
  const meta = isObj(params._meta) ? params._meta : {};
  const modern = `${META}protocolVersion` in meta || c.header("mcp-protocol-version") === MODERN;
  const bad = modern ? checkModern(c, id, msg.method, params, meta) : checkLegacy(c, id, msg.method);
  return bad ?? { c, id, method: msg.method, params, modern };
}

const isRequest = (msg: unknown): msg is Json & { method: string } => isObj(msg) && msg.jsonrpc === "2.0" && typeof msg.method === "string";

export async function dispatch(c: RpcCtx, msg: unknown): Promise<Reply> {
  if (!isRequest(msg)) return fail(400, undefined, -32600, "Invalid request: send one JSON-RPC 2.0 object.");
  if (!("id" in msg)) return { status: 202 };
  const call = parseCall(c, msg);
  if ("status" in call) return call;
  const run = methodFor(call);
  if (!run) return fail(call.modern ? 404 : 200, call.id, -32601, `Method not found: ${call.method}`);
  const result = await run(call);
  return isReply(result) ? result : reply(call, result);
}
