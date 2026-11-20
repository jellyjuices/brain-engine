import { test } from "node:test";
import assert from "node:assert/strict";
import { call, login, makeEnv, post } from "./helpers.ts";

const relayHeaders = { "X-Relay-Token": "relay-tok" };

async function capture(env: Parameters<typeof call>[0], cookie: string, body: unknown) {
  return call(env, "/api/inbox", post(body, { Cookie: cookie }));
}

test("relay routes need the token, and a session cookie does not open them", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  assert.equal((await call(env, "/relay/pending")).status, 401);
  assert.equal(
    (await call(env, "/relay/pending", { headers: { "X-Relay-Token": "wrong" } })).status,
    401,
  );
  assert.equal((await call(env, "/relay/pending", { headers: { Cookie: cookie } })).status, 401);
  assert.equal((await call(env, "/relay/ack", post({ client_ids: [] }))).status, 401);
  assert.equal((await call(env, "/relay/pending", { headers: relayHeaders })).status, 200);
});

test("the relay token is refused when RELAY_TOKEN is not set", async () => {
  const { env } = makeEnv({ RELAY_TOKEN: "" });
  assert.equal(
    (await call(env, "/relay/pending", { headers: { "X-Relay-Token": "" } })).status,
    401,
  );
});

test("inbox needs a session", async () => {
  const { env } = makeEnv();
  assert.equal((await call(env, "/api/inbox", post({ client_id: "a", text: "hi" }))).status, 401);
});

test("inbox stores a capture and pending returns it", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  const res = await capture(env, cookie, {
    client_id: "a",
    text: "Buy milk",
    tags: ["errand"],
    created_at: "2026-11-05T09:00:00",
  });
  assert.equal(res.status, 200);
  const pending = (await (await call(env, "/relay/pending", { headers: relayHeaders })).json()) as {
    items: Record<string, unknown>[];
  };
  assert.deepEqual(pending.items, [
    { client_id: "a", created_at: "2026-11-05T09:00:00", text: "Buy milk", tags: ["errand"] },
  ]);
});

test("inbox refuses more than 64 KB", async () => {
  const { env, db } = makeEnv();
  const cookie = await login(env);
  const res = await capture(env, cookie, { client_id: "big", text: "x".repeat(64 * 1024 + 1) });
  assert.equal(res.status, 413);
  assert.equal(db.inbox.size, 0);
  assert.equal(
    (await capture(env, cookie, { client_id: "ok", text: "x".repeat(60 * 1024) })).status,
    200,
  );
});

test("inbox needs client_id and text", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  assert.equal((await capture(env, cookie, { text: "hi" })).status, 400);
  assert.equal((await capture(env, cookie, { client_id: "a", text: "  " })).status, 400);
});

test("a repeat client_id returns the first result and keeps the first text", async () => {
  const { env, db } = makeEnv();
  const cookie = await login(env);
  const first = (await (await capture(env, cookie, { client_id: "a", text: "first" })).json()) as {
    received_at: number;
    duplicate: boolean;
  };
  assert.equal(first.duplicate, false);
  const second = (await (
    await capture(env, cookie, { client_id: "a", text: "second" })
  ).json()) as { received_at: number; duplicate: boolean };
  assert.equal(second.duplicate, true);
  assert.equal(second.received_at, first.received_at);
  assert.equal(db.inbox.size, 1);
  assert.equal(db.inbox.get("a")?.text, "first");
});

test("pending is oldest first", async () => {
  const { env, db } = makeEnv();
  function row(id: string, at: number) {
    return {
      client_id: id,
      created_at: "t",
      text: id,
      tags: "[]",
      received_at: at,
      into_path: null,
    };
  }
  for (const r of [row("c", 300), row("a", 100), row("b", 200)]) db.inbox.set(r.client_id, r);
  const { items } = (await (
    await call(env, "/relay/pending", { headers: relayHeaders })
  ).json()) as { items: { client_id: string }[] };
  assert.deepEqual(
    items.map((i) => i.client_id),
    ["a", "b", "c"],
  );
});

test("ack deletes only the ids it is given", async () => {
  const { env, db } = makeEnv();
  const cookie = await login(env);
  for (const id of ["a", "b", "c"]) await capture(env, cookie, { client_id: id, text: id });
  const res = await call(
    env,
    "/relay/ack",
    post({ client_ids: ["a", "c", "missing"] }, relayHeaders),
  );
  assert.equal(res.status, 200);
  assert.deepEqual([...db.inbox.keys()], ["b"]);
  assert.equal((await call(env, "/relay/ack", post({ nope: 1 }, relayHeaders))).status, 400);
});

test("inbox keeps an into path and pending returns it", async () => {
  const { env, db } = makeEnv();
  const cookie = await login(env);
  assert.equal(
    (await capture(env, cookie, { client_id: "a", text: "tomorrow: ask", into: "people/omar.md" }))
      .status,
    200,
  );
  assert.equal(db.inbox.get("a")?.into_path, "people/omar.md");
  const { items } = (await (
    await call(env, "/relay/pending", { headers: relayHeaders })
  ).json()) as { items: Record<string, unknown>[] };
  assert.equal(items[0].into, "people/omar.md");
});

test("a capture with no into has no into in pending", async () => {
  const { env } = makeEnv();
  const cookie = await login(env);
  await capture(env, cookie, { client_id: "a", text: "hi", into: null });
  const { items } = (await (
    await call(env, "/relay/pending", { headers: relayHeaders })
  ).json()) as { items: Record<string, unknown>[] };
  assert.equal("into" in items[0], false);
});

test("inbox refuses a bad into path", async () => {
  const { env, db } = makeEnv();
  const cookie = await login(env);
  const bad = [
    "../secret.md",
    "areas/../../x.md",
    "/etc/passwd.md",
    "areas/fitness.txt",
    "areas//x.md",
    "a\\b.md",
    "x".repeat(198) + ".md",
    7,
    "",
  ];
  const statuses = await Promise.all(
    bad.map(async (into, i) => [
      into,
      (await capture(env, cookie, { client_id: `bad-${i}`, text: "Call the dentist", into }))
        .status,
    ]),
  );
  assert.deepEqual(
    statuses,
    bad.map((into) => [into, 400]),
  );
  assert.equal(db.inbox.size, 0);
  assert.equal(
    (await capture(env, cookie, { client_id: "ok", text: "hi", into: "x".repeat(197) + ".md" }))
      .status,
    200,
  );
});
