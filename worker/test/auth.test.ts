import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionCookie, isValidSessionToken } from "../src/auth.ts";
import worker from "../src/index.ts";
import { PASSWORD, call, login, makeEnv, post } from "./helpers.ts";

test("unlock with the right password sets a strict cookie", async () => {
  const { env } = makeEnv();
  const res = await call(env, "/api/unlock", post({ password: PASSWORD }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { unlocked: true });
  const cookie = res.headers.get("Set-Cookie") ?? "";
  assert.match(cookie, /^brain_session=\d+\.[\w-]+;/);
  const flags = ["Path=/", "HttpOnly", "Secure", "SameSite=Strict", "Max-Age=2592000"];
  assert.deepEqual(
    flags.filter((flag) => !cookie.includes(flag)),
    [],
  );
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("unlock with a bad password is 401 and sets no cookie", async () => {
  const { env } = makeEnv();
  const res = await call(env, "/api/unlock", post({ password: "nope" }));
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("Set-Cookie"), null);
});

for (const unset of ["PASSWORD", "SESSION_SECRET"]) {
  test(`unlock is 503 when ${unset} is empty`, async () => {
    const { env } = makeEnv({ [unset]: "" });
    assert.equal((await call(env, "/api/unlock", post({ password: PASSWORD }))).status, 503);
  });
}

async function failUnlock(env: Parameters<typeof call>[0], times: number) {
  const tries = Array.from({ length: times }, () => post({ password: "wrong-horse-battery" }));
  return tries.reduce(
    async (seen, init) => [...(await seen), (await call(env, "/api/unlock", init)).status],
    Promise.resolve([] as number[]),
  );
}

test("the sixth try after five failures is 429 with Retry-After, even with the right password", async () => {
  const { env } = makeEnv();
  assert.deepEqual(await failUnlock(env, 5), [401, 401, 401, 401, 401]);
  const res = await call(env, "/api/unlock", post({ password: PASSWORD }));
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get("Retry-After")) > 0, `got ${res.headers.get("Retry-After")}`);
  assert.equal(
    (await call(env, "/api/unlock", { ...post({ password: PASSWORD }), ip: "9.9.9.9" })).status,
    200,
  );
});

test("a good unlock clears earlier failures", async () => {
  const { env, db } = makeEnv();
  await call(env, "/api/unlock", post({ password: "bad" }));
  await login(env);
  assert.equal(db.attempts.size, 0);
});

const NOW = Date.UTC(2026, 10, 14, 9, 30);
const NOW_SECONDS = NOW / 1000;

test("a failure window older than 15 minutes is forgotten", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: NOW });
  const { env, db } = makeEnv();
  db.attempts.set("1.2.3.4", { count: 5, first_at: NOW_SECONDS - 16 * 60 });
  assert.equal((await call(env, "/api/unlock", post({ password: PASSWORD }))).status, 200);
});

test("GET /api/unlock reports the cookie state", async () => {
  const { env } = makeEnv();
  assert.deepEqual(await (await call(env, "/api/unlock")).json(), { unlocked: false });
  const cookie = await login(env);
  assert.deepEqual(await (await call(env, "/api/unlock", { headers: { Cookie: cookie } })).json(), {
    unlocked: true,
  });
});

test("a valid cookie opens a gated route, no cookie gets 401 with no-store", async () => {
  const { env } = makeEnv();
  const denied = await call(env, "/api/today");
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get("Cache-Control"), "no-store");
  assert.equal(typeof ((await denied.json()) as { error: string }).error, "string");
  const cookie = await login(env);
  const res = await call(env, "/api/today", { headers: { Cookie: cookie } });
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: "The Mac is offline", offline: true });
});

test("an expired cookie is refused", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: NOW });
  const { env } = makeEnv();
  const old = (await createSessionCookie(env, NOW_SECONDS - 31 * 24 * 3600)).split(";")[0];
  assert.equal((await call(env, "/api/today", { headers: { Cookie: old } })).status, 401);
  assert.equal(await isValidSessionToken(env, old.split("=")[1]), false);
});

const tampers: [string, (name: string, stamp: string, mac: string) => string][] = [
  ["a stretched expiry", (name, stamp, mac) => `${name}=${Number(stamp) + 1000}.${mac}`],
  [
    "a flipped signature",
    (name, stamp, mac) => `${name}=${stamp}.${mac.slice(0, -1)}${mac.endsWith("A") ? "B" : "A"}`,
  ],
  ["a value with no signature", (name) => `${name}=garbage`],
];

for (const [label, tamper] of tampers) {
  test(`a cookie with ${label} is refused`, async () => {
    const { env } = makeEnv();
    const [name, token] = (await login(env)).split("=");
    const [stamp, mac] = token.split(".");
    const res = await call(env, "/api/today", { headers: { Cookie: tamper(name, stamp, mac) } });
    assert.equal(res.status, 401);
  });
}

test("changing the password ends every session", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  const changed = { ...env, PASSWORD: "a new password" };
  assert.equal((await call(changed, "/api/today", { headers: { Cookie: cookie } })).status, 401);
});

test("lock clears the cookie", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  const res = await call(env, "/api/lock", { method: "POST", headers: { Cookie: cookie } });
  assert.match(res.headers.get("Set-Cookie") ?? "", /Max-Age=0/);
});

test("health is open, and every response carries the security headers", async () => {
  const { env } = makeEnv();
  const res = await call(env, "/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Security-Policy"), "default-src 'self'");
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(res.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(res.headers.get("X-Frame-Options"), "DENY");
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("NO_PASSWORD=1 opens the API on localhost only", async () => {
  const { env } = makeEnv({ NO_PASSWORD: "1" });
  function local(path: string) {
    return worker.fetch(new Request(`http://localhost:8788${path}`), env);
  }
  assert.deepEqual(await (await local("/api/unlock")).json(), { unlocked: true, noPassword: true });
  assert.notEqual((await local("/api/today")).status, 401);
  assert.equal((await call(env, "/api/today")).status, 401);
  assert.deepEqual(await (await call(env, "/api/unlock")).json(), { unlocked: false });
});
