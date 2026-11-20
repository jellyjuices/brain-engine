import { test, type TestContext } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { readdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { addDays, today } from "../src/core/notes.ts";
import { loadAll } from "../src/core/files.ts";
import { pull, readRelayConfig, saveItem } from "../src/capture/pull.ts";
import { makeBrain } from "./fixture.ts";

interface Fake { server: Server; url: string; acks: string[][]; tokens: string[] }

const TOKEN = "relay-4f9c2a7e1b";

async function fakeRelay(t: TestContext, items: unknown[]): Promise<Fake> {
  const fake = { acks: [] as string[][], tokens: [] as string[] } as Fake;
  fake.server = createServer((req, res) => {
    fake.tokens.push(String(req.headers["x-relay-token"]));
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/relay/pending") return void res.end(JSON.stringify({ items }));
      if (req.url === "/relay/ack") fake.acks.push(JSON.parse(body).client_ids);
      res.end("{}");
    });
  });
  fake.server.listen(0, "127.0.0.1");
  await once(fake.server, "listening");
  t.after(() => fake.server.close());
  fake.url = `http://127.0.0.1:${(fake.server.address() as AddressInfo).port}`;
  return fake;
}

const item = (id: string, text: string) => ({ client_id: id, created_at: "2026-11-05T09:00:00", text, tags: [] });

test("pull lands each capture once and acks it", async (t) => {
  const root = makeBrain();
  const fake = await fakeRelay(t, [item("a1", "Buy milk"), item("a2", "Call Mom")]);
  const r = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(r.pulled, 2);
  assert.equal(readdirSync(join(root, "inbox")).length, 2);
  assert.deepEqual(fake.acks, [["a1", "a2"]]);
  assert.deepEqual(fake.tokens.filter((sent) => sent !== TOKEN), []);
  assert.deepEqual(loadAll(root).filter((n) => n.meta.client_id).map((n) => n.meta.client_id).sort(), ["a1", "a2"]);
});

test("pull skips a client_id already in the inbox and does not write it twice", async (t) => {
  const root = makeBrain();
  const fake = await fakeRelay(t, [item("a1", "Buy milk")]);
  await pull(root, { url: fake.url, token: TOKEN });
  const again = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(again.pulled, 0);
  assert.equal(again.skipped, 1);
  assert.equal(readdirSync(join(root, "inbox")).length, 1);
});

test("pull acks only what it wrote or already has, and ignores bad rows", async (t) => {
  const root = makeBrain();
  const fake = await fakeRelay(t, [item("a1", "Buy milk"), { client_id: "bad" }, { text: "no id" }]);
  await pull(root, { url: fake.url, token: TOKEN });
  assert.deepEqual(fake.acks, [["a1"]]);
});

test("pull sends no ack when nothing is pending", async (t) => {
  const root = makeBrain();
  const fake = await fakeRelay(t, []);
  const r = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(r.pulled, 0);
  assert.deepEqual(fake.acks, []);
});

test("readRelayConfig returns null when relay.env is missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "relay-"));
  assert.equal(readRelayConfig(join(dir, "none.env")), null);
});

test("readRelayConfig reads relay.env and trims the trailing slash", () => {
  const path = join(mkdtempSync(join(tmpdir(), "relay-")), "relay.env");
  writeFileSync(path, `RELAY_URL="https://brain.example.com/"\nRELAY_TOKEN=${TOKEN}\n`);
  assert.deepEqual(readRelayConfig(path), { url: "https://brain.example.com", token: TOKEN });
});

function brainWithOmar(): string {
  const root = makeBrain();
  writeFileSync(join(root, "people/omar.md"), "---\ntype: Person\ntitle: Omar\ndescription: A friend.\n---\n\n# To-dos\n\n# Notes\n");
  return root;
}
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");
const into = (id: string, text: string, path: string) => ({ ...item(id, text), into: path });

test("pull files text in the note the phone named, with its When prefix, and skips the inbox", async (t) => {
  const root = brainWithOmar();
  const fake = await fakeRelay(t, [into("n1", "tomorrow: call him back", "people/omar.md")]);
  const r = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(r.pulled, 1);
  assert.equal(r.filed, 1);
  assert.equal(readdirSync(join(root, "inbox")).length, 0);
  assert.match(read(root, "people/omar.md"), new RegExp(`- \\[ \\] call him back · due ${addDays(today(), 1)}`));
  assert.deepEqual(fake.acks, [["n1"]]);
});

test("pull makes a dated note line when the phone names a note and gives no When", async (t) => {
  const root = brainWithOmar();
  const fake = await fakeRelay(t, [into("n2", "Moved to Vancouver", "people/omar.md")]);
  await pull(root, { url: fake.url, token: TOKEN });
  assert.match(read(root, "people/omar.md"), /- 2026-11-05 · Moved to Vancouver/);
});

test("pull falls back to the inbox when the named note is missing, in the inbox or outside the folder", async (t) => {
  const root = brainWithOmar();
  const fake = await fakeRelay(t, [into("m1", "today: gone", "people/nobody.md"), into("m2", "to inbox", "../outside.md"), into("m3", "not filed", "inbox/x.md")]);
  const r = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(r.filed, 0);
  assert.equal(readdirSync(join(root, "inbox")).length, 3);
  assert.deepEqual(fake.acks, [["m1", "m2", "m3"]]);
});

test("pull does not file an item twice when the ack was lost", async (t) => {
  const root = brainWithOmar();
  const fake = await fakeRelay(t, [into("n3", "today: once only", "people/omar.md")]);
  await pull(root, { url: fake.url, token: TOKEN });
  const again = await pull(root, { url: fake.url, token: TOKEN });
  assert.equal(again.pulled, 0);
  assert.equal(again.skipped, 1);
  assert.equal(read(root, "people/omar.md").match(/once only/g)?.length, 1);
});

const routed: [string, string, string][] = [
  ["a note: fact about a person is filed on them", "note: Omar moved to Vancouver", "filed"],
  ["a to-do that mentions only a person is filed on them", "tomorrow: call Omar back", "filed"],
  ["plain text with no date and no subject stays in the inbox", "a loose thought", "inbox"],
];

for (const [label, text, saved] of routed) {
  test(`saveItem: ${label}`, () => {
    assert.equal(saveItem(brainWithOmar(), item("r1", text)).saved, saved);
  });
}

test("saveItem files a to-do that names only a person on them, marked check", () => {
  const root = brainWithOmar();
  saveItem(root, item("r2", "tomorrow: call Omar back"));
  assert.match(read(root, "people/omar.md"), /^- \[ \] call Omar back · due \d{4}-\d{2}-\d{2} · check$/m);
});

test("saveItem files a to-do the sorter is sure of with no check", () => {
  const root = brainWithOmar();
  const guess = { into: "people/omar.md", how: "near" as const, sure: true, people: [], re: [] };
  saveItem(root, item("r3", "tomorrow: return the ladder"), guess);
  assert.match(read(root, "people/omar.md"), /^- \[ \] return the ladder · due \d{4}-\d{2}-\d{2}$/m);
});

test("saveItem leaves a capture in the inbox when the sorter has no guess", () => {
  const root = brainWithOmar();
  const none = { into: null, how: "none" as const, sure: false, people: [], re: [] };
  assert.equal(saveItem(root, { ...item("r4", "buy oat milk"), kind: "todo" as const }, none).saved, "inbox");
});
