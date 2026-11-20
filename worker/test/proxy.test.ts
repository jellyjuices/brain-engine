import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { call, login, makeEnv, post } from "./helpers.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

interface Seen {
  url: string;
  init: RequestInit & { headers: Headers };
}

function stub(respond: () => Response | Promise<Response>): Seen[] {
  const seen: Seen[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit & { headers: Headers }) => {
    seen.push({ url: String(url), init });
    return respond();
  }) as typeof fetch;
  return seen;
}

async function setup() {
  const { env } = makeEnv({ MAC_ORIGIN: "https://mac.example.com/", SERVER_TOKEN: "srv-token" });
  return { env, cookie: await login(env) };
}

test("proxy forwards method, path, query and body with the server token, without cookie", async () => {
  const { env, cookie } = await setup();
  const seen = stub(() => Response.json({ ok: 1 }));
  const res = await call(env, "/api/search?q=doctor&type=Person", {
    ...post(
      { ref: "a" },
      { Cookie: cookie, Authorization: "Bearer phone", "Content-Type": "application/json" },
    ),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: 1 });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://mac.example.com/api/search?q=doctor&type=Person");
  assert.equal(seen[0].init.method, "POST");
  assert.equal(seen[0].init.headers.get("Authorization"), "Bearer srv-token");
  assert.equal(seen[0].init.headers.get("Cookie"), null);
  assert.equal(seen[0].init.headers.get("Content-Type"), "application/json");
  assert.equal(
    new TextDecoder().decode(seen[0].init.body as ArrayBuffer),
    JSON.stringify({ ref: "a" }),
  );
});

test("proxy passes a Mac error status and body through", async () => {
  const { env, cookie } = await setup();
  stub(() => Response.json({ error: "changed", current: {} }, { status: 409 }));
  const res = await call(env, "/api/notes/projects/a.md", {
    method: "PUT",
    body: "{}",
    headers: { Cookie: cookie },
  });
  assert.equal(res.status, 409);
  assert.equal(((await res.json()) as { error: string }).error, "changed");
});

for (const status of [502, 503, 504, 530]) {
  test(`proxy says the Mac is offline when the tunnel answers ${status}`, async () => {
    const { env, cookie } = await setup();
    stub(() => new Response("tunnel", { status }));
    const res = await call(env, "/api/today", { headers: { Cookie: cookie } });
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: "The Mac is offline", offline: true });
  });
}

test("proxy says the Mac is offline on a network failure", async () => {
  const { env, cookie } = await setup();
  stub(() => {
    throw new TypeError("fetch failed");
  });
  const down = await call(env, "/api/today", { headers: { Cookie: cookie } });
  assert.equal(down.status, 503);
  assert.deepEqual(await down.json(), { error: "The Mac is offline", offline: true });
});

test("proxy is offline when MAC_ORIGIN is not set, and never reached when locked", async () => {
  const { env: bare } = makeEnv();
  const cookie = await login(bare);
  const seen = stub(() => Response.json({}));
  assert.equal((await call(bare, "/api/today", { headers: { Cookie: cookie } })).status, 503);
  const { env } = makeEnv({ MAC_ORIGIN: "https://mac.example.com" });
  assert.equal((await call(env, "/api/today")).status, 401);
  assert.equal(seen.length, 0);
});
