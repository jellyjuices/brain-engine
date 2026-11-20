import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { RateLimit } from "../src/interface/server-agent.ts";
import { ROUTES } from "../src/interface/routes/table.ts";
import { withApi } from "./api-helpers.ts";

test("health answers with no token", () => withApi(async (a) => {
  assert.equal((await a.call("GET", "/api/health", undefined, null)).status, 200);
}));

test("every route but health is 401 with no token", () => withApi(async (a) => {
  const calls = ROUTES.map(async (r) => {
    const path = r.prefix ? `${r.path}garden-shed.md` : r.path;
    const body = r.method === "GET" || r.method === "DELETE" ? undefined : {};
    return `${r.method} ${path} ${(await a.call(r.method, path, body, null)).status}`;
  });
  const seen = await Promise.all(calls);
  assert.deepEqual(seen.filter((s) => !s.endsWith(" 401")), []);
}));

test("a made-up token is 401", () => withApi(async (a) => {
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
  const retryAfter = Number(third.headers.get("retry-after"));
  assert.ok(retryAfter > 0, `got ${retryAfter}`);
}, { agentRate: 2 }));

test("the owner has no rate limit", () => withApi(async (a) => {
  const statuses = await Promise.all([1, 2, 3, 4].map(async () => (await a.call("GET", "/api/log")).status));
  assert.deepEqual(statuses, [200, 200, 200, 200]);
}, { agentRate: 2 }));

test("rate limit opens again after the minute", () => {
  const limit = new RateLimit(1);
  assert.equal(limit.take(1_000), 0);
  const wait = limit.take(2_000);
  assert.ok(wait > 0, `got ${wait}`);
  assert.equal(limit.take(61_001), 0);
});

test("every route has a tool name, and no two share one", () => {
  const tools = ROUTES.map((r) => r.tool);
  assert.equal(new Set(tools).size, tools.length);
  assert.deepEqual(ROUTES.filter((r) => r.summary.length === 0).map((r) => r.tool), []);
});
