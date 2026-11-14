import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { RateLimit } from "../src/interface/server-agent.ts";
import { ROUTES } from "../src/interface/routes/table.ts";
import { withApi } from "./api-helpers.ts";

test("no token, a wrong token, or no agent token yet: 401 on every route but health", () => withApi(async (a) => {
  assert.equal((await a.call("GET", "/api/health", undefined, null)).status, 200);
  for (const r of ROUTES) {
    const path = r.prefix ? `${r.path}x.md` : r.path;
    assert.equal((await a.call(r.method, path, r.method === "GET" || r.method === "DELETE" ? undefined : {}, null)).status, 401, `${r.method} ${path}`);
  }
  assert.equal((await a.call("GET", "/api/unsorted", undefined, "made-up")).status, 401);
}));

test("agent token: the owner makes it, a helper uses it, the owner revokes it", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/agent-token", {});
  assert.equal(made.status, 200);
  const agent = made.data.token as string;
  assert.equal(made.data.path, a.agentFile);
  assert.equal(statSync(a.agentFile).mode & 0o777, 0o600);
  assert.equal((await a.call("GET", "/api/unsorted", undefined, agent)).status, 200);
  assert.equal((await a.call("POST", "/api/agent-token", {}, agent)).status, 403);
  assert.equal((await a.call("DELETE", "/api/agent-token", undefined, agent)).status, 403);
  const add = await a.call("POST", "/api/add", { client_id: "g1", text: "a helper's thought", by: "owner" }, agent);
  assert.match(readFileSync(join(a.root, add.data.path), "utf8"), /generated: \{by: agent,/);
  assert.equal((await a.call("DELETE", "/api/agent-token")).data.revoked, true);
  assert.equal((await a.call("GET", "/api/unsorted", undefined, agent)).status, 401);
}));

test("agent token: calls past the rate limit get 429 with Retry-After; the owner has no limit", () => withApi(async (a) => {
  const agent = (await a.call("POST", "/api/agent-token", {})).data.token as string;
  assert.equal((await a.call("GET", "/api/log", undefined, agent)).status, 200);
  assert.equal((await a.call("GET", "/api/log", undefined, agent)).status, 200);
  const third = await a.call("GET", "/api/log", undefined, agent);
  assert.equal(third.status, 429);
  assert.ok(Number(third.headers.get("retry-after")) > 0);
  for (let i = 0; i < 4; i++) assert.equal((await a.call("GET", "/api/log")).status, 200);
}, { agentRate: 2 }));

test("rate limit opens again after the minute", () => {
  const limit = new RateLimit(1);
  assert.equal(limit.take(1_000), 0);
  assert.ok(limit.take(2_000) > 0);
  assert.equal(limit.take(61_001), 0);
});

test("every route has a tool name, and no two share one", () => {
  const tools = ROUTES.map((r) => r.tool);
  assert.equal(new Set(tools).size, tools.length);
  assert.ok(ROUTES.every((r) => r.summary.length > 0));
});
