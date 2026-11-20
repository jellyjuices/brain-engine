// One MCP tool per route in routes/table.ts. Owner-only routes and routes marked `mcp: false` are left out. A call runs the route's own handler in
// process, wrapped the way server.ts wraps it: a write is snapshotted, then re-indexed and checked (server-check.ts).

import { ROUTES, type Route } from "../routes/table.ts";
import { HttpError } from "../server-auth.ts";
import { snapshot, withCheck } from "../server-check.ts";
import { TextBody } from "../server-send.ts";
import { INPUTS } from "./inputs.ts";
import type { Input, Json } from "./schema.ts";

export const MAX_RESULT = 4 * 1024;
export const CUT_NOTE = "\n[Cut at 4 KB. Narrow your query: add a limit, a type or tag, or more exact words.]";

export interface Tool {
  route: Route;
  input: Input;
  def: { name: string; description: string; inputSchema: Json; annotations: Json };
}

function annotations(r: Route): Json {
  if (r.method === "GET") return { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
  return { readOnlyHint: false, destructiveHint: r.method === "DELETE", openWorldHint: false };
}

function toolOf(route: Route): Tool {
  const input = INPUTS[route.tool];
  if (!input) throw new Error(`No MCP input for the ${route.tool} route.`);
  const description = [route.summary, route.use].filter(Boolean).join(" ");
  return { route, input, def: { name: route.tool, description, inputSchema: input.schema, annotations: annotations(route) } };
}

export const TOOLS: Tool[] = ROUTES.filter((r) => !r.owner && r.mcp !== false).map(toolOf);
const BY_NAME = new Map(TOOLS.map((t) => [t.def.name, t]));

export const findTool = (name: string) => BY_NAME.get(name);

const segments = (v: string) => v.split("/").map(encodeURIComponent).join("/");

/** Build the request the route would get over HTTP, then run it. Throws HttpError just as the route does. */
export async function runTool(tool: Tool, args: Json, root: string, agentFile: string): Promise<unknown> {
  const { route, input } = tool;
  const fields = { ...args };
  let rest = "";
  if (input.rest) {
    const v = fields[input.rest];
    if (typeof v !== "string" || !v) throw new HttpError(400, `Missing "${input.rest}".`);
    rest = segments(v);
    delete fields[input.rest];
  }
  const url = new URL(route.path + rest, "http://localhost");
  if (route.method === "GET") for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  const body = route.method === "POST" || route.method === "PUT" ? fields : {};
  const before = route.method === "GET" ? undefined : snapshot(root);
  const result = await route.handler({ root, url, body, caller: "agent", agentFile }, rest);
  return before ? withCheck(root, before, result) : result;
}

/** Plain text for the agent, never over MAX_RESULT bytes. */
export function capText(result: unknown): string {
  const full = result instanceof TextBody ? result.text : JSON.stringify(result) ?? "null";
  if (Buffer.byteLength(full) <= MAX_RESULT) return full;
  const room = MAX_RESULT - Buffer.byteLength(CUT_NOTE);
  return Buffer.from(full).subarray(0, room).toString("utf8").replace(/�+$/, "") + CUT_NOTE;
}
