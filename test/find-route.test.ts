// The find route returns fused hits and the answer card; the changes feed carries vectors for changed entries only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { embedPending } from "../src/core/embed.ts";
import { updateIndex, useEmbedder } from "../src/core/search.ts";
import { startApi, type Api } from "./api-helpers.ts";
import { fakeEmbedder, t9Brain } from "./t9-brain.ts";

async function withT9(embedded: boolean, fn: (api: Api) => Promise<void>) {
  const root = t9Brain();
  updateIndex(root);
  if (embedded) await embedPending(root, fakeEmbedder);
  useEmbedder(embedded ? fakeEmbedder : null);
  const api = await startApi({}, root);
  try {
    await fn(api);
  } finally {
    api.close();
    useEmbedder(undefined);
  }
}

const since = (ms: number) => `/api/notes?since=${encodeURIComponent(new Date(ms).toISOString())}`;

test("find embeds the query when the embedder is there, and keeps the answer small", () => withT9(true, async (a) => {
  const r = await a.call("GET", "/api/find?q=molar");
  assert.equal(r.status, 200);
  assert.equal(r.data.meaning, "query");
  assert.equal(r.data.hits[0].path, "topics/health-log.md");
  assert.equal(r.data.answer.path, "topics/health-log.md");
  assert.equal(r.data.hits[0].kind, "todo");
  assert.deepEqual(Object.keys(r.data.hits[0]).sort(), ["date", "done", "kind", "line", "path", "score", "snippet", "title", "type"]);
  assert.ok(JSON.stringify(r.data).length < 4096);
}));

test("find answers on words and strings with no embedder; filters drop the card; search is gone", () => withT9(false, async (a) => {
  const typo = await a.call("GET", "/api/find?q=dentst");
  assert.equal(typo.data.meaning, "off");
  assert.equal(typo.data.hits[0].path, "topics/health-log.md");
  const named = await a.call("GET", "/api/find?q=Mira%20Okafor");
  assert.equal(named.data.card.subject.path, "people/mira-okafor.md");
  assert.equal(named.data.hits[0].path, "people/mira-okafor.md");
  const filtered = await a.call("GET", "/api/find?q=Mira&type=Journal");
  assert.equal(filtered.data.card, undefined);
  assert.ok(filtered.data.hits.every((h: { type: string }) => h.type === "Journal"));
  assert.equal((await a.call("GET", "/api/search?q=Mira")).status, 404);
}));

test("the changes feed has an empty vector list before any embedding", () => withT9(false, async (a) => {
  const r = await a.call("GET", "/api/notes");
  assert.equal(r.status, 200);
  assert.ok(r.data.notes.length >= 40);
  assert.equal(typeof r.data.model, "string");
  assert.deepEqual(r.data.vectors, []);
}));

test("the changes feed carries id, hash and int8 vector for changed entries only, with the model", () => withT9(true, async (a) => {
  const all = await a.call("GET", "/api/notes");
  assert.equal(all.data.model, fakeEmbedder.model);
  assert.ok(all.data.vectors.length > 10);
  for (const v of all.data.vectors) {
    assert.match(v.id, /^[0-9a-f]+$/);
    assert.match(v.hash, /^[0-9a-f]+$/);
    assert.equal(Buffer.from(v.vec, "base64").length, 4);
  }
  assert.deepEqual((await a.call("GET", since(Date.now() + 60_000))).data.vectors, []);
  const before = Date.now();
  appendFileSync(join(a.root, "topics/money.md"), "\n- [ ] Ask about the salary review\n");
  updateIndex(a.root);
  assert.equal(await embedPending(a.root, fakeEmbedder), 1);
  const changed = await a.call("GET", since(before));
  assert.equal(changed.data.vectors.length, 1);
  assert.ok(changed.data.notes.some((n: { path: string }) => n.path === "topics/money.md"));
}));
