import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { call, makeEnv } from "./helpers.ts";

const TOKEN = "a".repeat(40);
const FEED = "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n";
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stub(respond: () => Response): string[] {
  const seen: string[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen.push(`${String(url)} ${new Headers(init.headers).get("Authorization")}`);
    return respond();
  }) as typeof fetch;
  return seen;
}

function env(overrides = {}) {
  return makeEnv({ MAC_ORIGIN: "https://mac.example.com/", SERVER_TOKEN: "srv", CAL_TOKEN: TOKEN, ...overrides }).env;
}

test("the feed URL with the right token gets the Mac feed with the server token", async () => {
  const seen = stub(() => new Response(FEED, { headers: { "Content-Type": "text/calendar" } }));
  const res = await call(env(), `/cal/${TOKEN}.ics`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Content-Type")!, /^text\/calendar/);
  assert.equal(await res.text(), FEED);
  assert.deepEqual(seen, ["https://mac.example.com/api/cal.ics Bearer srv"]);
});

test("a wrong, short or missing token is not found and never reaches the Mac", async () => {
  const seen = stub(() => new Response(FEED));
  assert.equal((await call(env(), `/cal/${"b".repeat(40)}.ics`)).status, 404);
  assert.equal((await call(env(), `/cal/${TOKEN}`)).status, 404);
  assert.equal((await call(env({ CAL_TOKEN: "short" }), "/cal/short.ics")).status, 404);
  assert.equal((await call(env({ CAL_TOKEN: undefined }), `/cal/${TOKEN}.ics`)).status, 404);
  assert.equal(seen.length, 0);
});

test("the feed is read only and says offline when the Mac is down", async () => {
  stub(() => new Response("down", { status: 530 }));
  assert.equal((await call(env(), `/cal/${TOKEN}.ics`, { method: "POST" })).status, 405);
  assert.equal((await call(env(), `/cal/${TOKEN}.ics`)).status, 503);
});
