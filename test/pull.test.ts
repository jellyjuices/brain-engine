import { test } from "node:test";
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

async function fakeRelay(items: unknown[]): Promise<Fake> {
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
  fake.url = `http://127.0.0.1:${(fake.server.address() as AddressInfo).port}`;
  return fake;
}

const item = (id: string, text: string) => ({ client_id: id, created_at: "2026-11-05T09:00:00", text, tags: [] });

test("pull lands each capture once and acks it", async () => {
  const root = makeBrain();
  const fake = await fakeRelay([item("a1", "Buy milk"), item("a2", "Call Mom")]);
  try {
    const r = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(r.pulled, 2);
    assert.equal(readdirSync(join(root, "inbox")).length, 2);
    assert.deepEqual(fake.acks, [["a1", "a2"]]);
    assert.ok(fake.tokens.every((t) => t === "tok"));
    assert.deepEqual(loadAll(root).filter((n) => n.meta.client_id).map((n) => n.meta.client_id).sort(), ["a1", "a2"]);
  } finally {
    fake.server.close();
  }
});

test("pull skips a client_id already in the inbox and does not write it twice", async () => {
  const root = makeBrain();
  const fake = await fakeRelay([item("a1", "Buy milk")]);
  try {
    await pull(root, { url: fake.url, token: "tok" });
    const again = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(again.pulled, 0);
    assert.equal(again.skipped, 1);
    assert.equal(readdirSync(join(root, "inbox")).length, 1);
  } finally {
    fake.server.close();
  }
});

test("pull acks only what it wrote or already has, and ignores bad rows", async () => {
  const root = makeBrain();
  const fake = await fakeRelay([item("a1", "Buy milk"), { client_id: "bad" }, { text: "no id" }]);
  try {
    await pull(root, { url: fake.url, token: "tok" });
    assert.deepEqual(fake.acks, [["a1"]]);
  } finally {
    fake.server.close();
  }
});

test("pull sends no ack when nothing is pending", async () => {
  const root = makeBrain();
  const fake = await fakeRelay([]);
  try {
    const r = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(r.pulled, 0);
    assert.deepEqual(fake.acks, []);
  } finally {
    fake.server.close();
  }
});

test("readRelayConfig reads relay.env and returns null when missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "relay-"));
  assert.equal(readRelayConfig(join(dir, "none.env")), null);
  const path = join(dir, "relay.env");
  writeFileSync(path, 'RELAY_URL="https://brain.example.com/"\nRELAY_TOKEN=abc\n');
  assert.deepEqual(readRelayConfig(path), { url: "https://brain.example.com", token: "abc" });
});

function brainWithOmar(): string {
  const root = makeBrain();
  writeFileSync(join(root, "people/omar.md"), "---\ntype: Person\ntitle: Omar\ndescription: A friend.\n---\n\n# To-dos\n\n# Notes\n");
  return root;
}
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");
const into = (id: string, text: string, path: string) => ({ ...item(id, text), into: path });

test("pull files text in the note the phone named, with its When prefix, and skips the inbox", async () => {
  const root = brainWithOmar();
  const fake = await fakeRelay([into("n1", "tomorrow: call him back", "people/omar.md")]);
  try {
    const r = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(r.pulled, 1);
    assert.equal(r.filed, 1);
    assert.equal(readdirSync(join(root, "inbox")).length, 0);
    assert.match(read(root, "people/omar.md"), new RegExp(`- \\[ \\] call him back · due ${addDays(today(), 1)}`));
    assert.deepEqual(fake.acks, [["n1"]]);
  } finally {
    fake.server.close();
  }
});

test("pull makes a dated note line when the phone names a note and gives no When", async () => {
  const root = brainWithOmar();
  const fake = await fakeRelay([into("n2", "Moved to Vancouver", "people/omar.md")]);
  try {
    await pull(root, { url: fake.url, token: "tok" });
    assert.match(read(root, "people/omar.md"), /- 2026-11-05 · Moved to Vancouver/);
  } finally {
    fake.server.close();
  }
});

test("pull falls back to the inbox when the named note is missing, in the inbox or outside the folder", async () => {
  const root = brainWithOmar();
  const fake = await fakeRelay([into("m1", "today: gone", "people/nobody.md"), into("m2", "to inbox", "../outside.md"), into("m3", "not filed", "inbox/x.md")]);
  try {
    const r = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(r.filed, 0);
    assert.equal(readdirSync(join(root, "inbox")).length, 3);
    assert.deepEqual(fake.acks, [["m1", "m2", "m3"]]);
  } finally {
    fake.server.close();
  }
});

test("pull does not file an item twice when the ack was lost", async () => {
  const root = brainWithOmar();
  const fake = await fakeRelay([into("n3", "today: once only", "people/omar.md")]);
  try {
    await pull(root, { url: fake.url, token: "tok" });
    const again = await pull(root, { url: fake.url, token: "tok" });
    assert.equal(again.pulled, 0);
    assert.equal(again.skipped, 1);
    assert.equal(read(root, "people/omar.md").match(/once only/g)?.length, 1);
  } finally {
    fake.server.close();
  }
});

test("saveItem sends a mention of a person to the inbox, but files a note: fact on them", () => {
  const root = brainWithOmar();
  assert.equal(saveItem(root, item("r1", "note: Omar moved to Vancouver")).saved, "filed");
  assert.equal(saveItem(root, item("r2", "tomorrow: call Omar back")).saved, "inbox");
  assert.equal(saveItem(root, item("r4", "get a massage, maybe Omar")).saved, "inbox");
  assert.equal(readdirSync(join(root, "inbox")).length, 2);
  const note = read(root, "people/omar.md");
  assert.match(note, /Omar moved to Vancouver/);
  assert.doesNotMatch(note, /call Omar back/);
});

test("saveItem keeps plain text with no date and no subject in the inbox", () => {
  const root = brainWithOmar();
  assert.equal(saveItem(root, item("r3", "a loose thought")).saved, "inbox");
});
