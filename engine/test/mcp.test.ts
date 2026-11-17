// T4: the MCP server at /mcp over real HTTP on a random port: auth, the tool list, a call, a capped result.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { issueAgentToken } from "../src/interface/server-agent.ts";
import { CUT_NOTE, capText, MAX_RESULT, TOOLS } from "../src/interface/mcp/tools.ts";
import { LEGACY, MODERN } from "../src/interface/mcp/rpc.ts";
import { ROUTES } from "../src/interface/routes/table.ts";
import { type Api, TOKEN, withApi } from "./api-helpers.ts";

const SNAPSHOT = join(import.meta.dirname, "mcp-tools.snapshot.json");
const META = { "io.modelcontextprotocol/protocolVersion": MODERN, "io.modelcontextprotocol/clientCapabilities": {} };

async function rpc(a: Api, msg: Record<string, unknown>, auth: string | null, headers: Record<string, string> = {}) {
  const res = await fetch(`${a.base}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...headers },
    body: JSON.stringify({ jsonrpc: "2.0", ...msg }),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : undefined, headers: res.headers };
}

test("T4: the tool list matches its snapshot (set UPDATE_SNAPSHOT=1 to rewrite it)", () => {
  const defs = TOOLS.map((t) => t.def);
  if (process.env.UPDATE_SNAPSHOT || !existsSync(SNAPSHOT)) writeFileSync(SNAPSHOT, JSON.stringify(defs, null, 2) + "\n");
  assert.deepEqual(defs, JSON.parse(readFileSync(SNAPSHOT, "utf8")));
  for (const d of defs) assert.ok(d.description.split(/\s+/).length < 30, `${d.name}: description is 30 words or more`);
});

test("T4: one tool per route, and owner-only and hidden routes have none", () => {
  assert.deepEqual(TOOLS.map((t) => t.route), ROUTES.filter((r) => !r.owner && r.mcp !== false));
  const names = new Set(TOOLS.map((t) => t.def.name));
  for (const r of ROUTES.filter((x) => x.owner || x.mcp === false)) assert.equal(names.has(r.tool), false, r.tool);
  assert.equal(TOOLS.length, 22);
  for (const t of TOOLS) assert.equal(t.def.annotations.readOnlyHint, t.route.method === "GET", t.def.name);
});

test("T4: no token, a wrong token or the owner token gets 401", () => withApi(async (a) => {
  issueAgentToken(a.agentFile);
  for (const auth of [null, "made-up", TOKEN]) {
    const r = await rpc(a, { id: 1, method: "tools/list" }, auth);
    assert.equal(r.status, 401, String(auth));
    assert.equal(r.headers.get("www-authenticate"), "Bearer");
  }
}));

test("T4: initialize, tools/list, then tools/call, end to end", () => withApi(async (a) => {
  const agent = issueAgentToken(a.agentFile);
  const init = await rpc(a, { id: 1, method: "initialize", params: { protocolVersion: LEGACY[0], capabilities: {}, clientInfo: { name: "test", version: "1" } } }, agent);
  assert.equal(init.status, 200);
  assert.equal(init.data.result.protocolVersion, LEGACY[0]);
  assert.deepEqual(init.data.result.capabilities, { tools: {} });
  assert.equal(init.headers.get("mcp-session-id"), null);
  assert.equal((await rpc(a, { method: "notifications/initialized" }, agent)).status, 202);
  const list = await rpc(a, { id: 2, method: "tools/list" }, agent, { "MCP-Protocol-Version": LEGACY[0] });
  assert.equal(list.data.result.tools.length, TOOLS.length);
  assert.deepEqual(list.data.result.tools.filter((t: { name: string }) => t.name === "agent_token"), []);
  const call = await rpc(a, { id: 3, method: "tools/call", params: { name: "find", arguments: { q: "cedar" } } }, agent);
  assert.equal(call.data.result.isError, false);
  assert.match(JSON.parse(call.data.result.content[0].text).hits[0].path, /garden-shed/);
  const owner = await rpc(a, { id: 4, method: "tools/call", params: { name: "agent_token", arguments: {} } }, agent);
  assert.equal(owner.data.error.code, -32602);
  const bad = await rpc(a, { id: 5, method: "tools/call", params: { name: "find", arguments: {} } }, agent);
  assert.equal(bad.data.result.isError, true);
  assert.match(bad.data.result.content[0].text, /Missing \\"q\\"/);
}));

test("T4: a modern request carries its version in _meta and headers", () => withApi(async (a) => {
  const agent = issueAgentToken(a.agentFile);
  const h = { "MCP-Protocol-Version": MODERN, "Mcp-Method": "tools/call", "Mcp-Name": "unsorted" };
  const ok = await rpc(a, { id: 1, method: "tools/call", params: { name: "unsorted", arguments: {}, _meta: META } }, agent, h);
  assert.equal(ok.status, 200);
  assert.equal(ok.data.result.resultType, "complete");
  assert.deepEqual(JSON.parse(ok.data.result.content[0].text), { count: 0, items: [] });
  const mismatch = await rpc(a, { id: 2, method: "tools/call", params: { name: "today", arguments: {}, _meta: META } }, agent, h);
  assert.equal(mismatch.status, 400);
  assert.equal(mismatch.data.error.code, -32020);
  const old = await rpc(a, { id: 3, method: "ping", params: { _meta: { ...META, "io.modelcontextprotocol/protocolVersion": "1900-01-01" } } }, agent, { "MCP-Protocol-Version": "1900-01-01", "Mcp-Method": "ping" });
  assert.equal(old.status, 400);
  assert.equal(old.data.error.code, -32022);
  const discover = await rpc(a, { id: 4, method: "server/discover", params: { _meta: META } }, agent, { "MCP-Protocol-Version": MODERN, "Mcp-Method": "server/discover" });
  assert.deepEqual(discover.data.result.supportedVersions, [MODERN, ...LEGACY]);
  const missing = await rpc(a, { id: 5, method: "nope", params: { _meta: META } }, agent, { "MCP-Protocol-Version": MODERN, "Mcp-Method": "nope" });
  assert.equal(missing.status, 404);
}));

test("T4: the agent rate limit applies to /mcp too", () => withApi(async (a) => {
  const agent = issueAgentToken(a.agentFile);
  assert.equal((await rpc(a, { id: 1, method: "ping" }, agent)).status, 200);
  const r = await rpc(a, { id: 2, method: "ping" }, agent);
  assert.equal(r.status, 429);
  const retryAfter = Number(r.headers.get("retry-after"));
  assert.ok(retryAfter > 0, `got ${retryAfter}`);
}, { agentRate: 1 }));

test("T4: a too-large result is cut at 4 KB with a note to narrow the query", () => withApi(async (a) => {
  const agent = issueAgentToken(a.agentFile);
  const longBody = Array.from({ length: 200 }, (_, i) => `A long made-up line, number ${i}, about nothing real.`).join("\n");
  writeFileSync(join(a.root, "projects/made-up-long.md"), `---\ntype: Project\ntitle: Made-up long project\ndescription: A made-up project with a long body.\n---\n\n# Notes\n\n${longBody}\n`);
  const r = await rpc(a, { id: 1, method: "tools/call", params: { name: "read_note", arguments: { path: "projects/made-up-long.md" } } }, agent);
  const text = r.data.result.content[0].text as string;
  const size = Buffer.byteLength(text);
  assert.ok(size <= MAX_RESULT, `got ${size} bytes`);
  assert.equal(text.endsWith(CUT_NOTE), true, `missing ${CUT_NOTE}`);
  assert.equal(capText({ small: true }), `{"small":true}`);
}));
