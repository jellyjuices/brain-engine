import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { withApi } from "./api-helpers.ts";
import { BIN } from "./fixture.ts";
import { titleFrom } from "../src/capture/journal.ts";
import { parse } from "../src/core/notes.ts";

const SHED = "projects/garden-shed.md";
const DANA = "people/dana-cole.md";
const MORNING = "Woke up early, and the shed roof leaks again!\n\n  Dana lent us her ladder,   which was kind.";
const EVENING = "Quiet night. Read two chapters.";
const ONE = "journal/2026-11-14-0930-woke-up-early-and-the-shed.md";
const TWO = "journal/2026-11-14-2105-quiet-night-read-two-chapters.md";
const file = (root: string, path: string) => readFileSync(join(root, path), "utf8");

async function twoJournals(a: { call: Function }) {
  const one = await a.call("POST", "/api/add", { client_id: "j1", kind: "journal", text: MORNING, created_at: "2026-11-14T09:30:00" });
  const two = await a.call("POST", "/api/journal", { date: "2026-11-14", title: "", text: EVENING, created_at: "2026-11-14T21:05:00" });
  return { one, two };
}

test("journal: a title is the first words, cut at a word break, with no trailing punctuation", () => {
  assert.equal(titleFrom(MORNING), "Woke up early, and the shed");
  assert.equal(titleFrom("Rain!!"), "Rain");
  assert.equal(titleFrom("  ...  "), "Journal");
  assert.equal(titleFrom("Supercalifragilisticexpialidocious ".repeat(4)).length <= 60, true);
});

test("journal: two adds on one day make two notes, each whole, with its own title and slug", () => withApi(async (a) => {
  const { one, two } = await twoJournals(a);
  assert.deepEqual([one.data.saved, one.data.path, one.data.check], ["journal", ONE, undefined]);
  assert.deepEqual([two.data.path, two.data.created, two.data.check], [TWO, true, undefined]);
  const n = parse(file(a.root, ONE));
  assert.deepEqual(n.meta, { type: "Journal", title: "Woke up early, and the shed", description: "Journal for 2026-11-14 09:30.", date: "2026-11-14T09:30", sorted: false });
  assert.equal(n.body, `${MORNING}\n`);
  assert.equal(parse(file(a.root, TWO)).meta.title, "Quiet night. Read two chapters");
  assert.equal((await a.call("POST", "/api/add", { client_id: "j1", kind: "journal", text: MORNING })).data.saved, "skipped");
  assert.equal((await a.call("POST", "/api/journal", { date: "2026-11-14", text: EVENING })).data.created, false);
  const titled = await a.call("POST", "/api/add", { client_id: "j3", kind: "journal", title: "Shed worries", text: "More on the roof.", created_at: "2026-11-14T09:30:40" });
  assert.equal(titled.data.path, "journal/2026-11-14-0930-shed-worries.md");
  assert.equal((await a.call("POST", "/api/add", { client_id: "j4", kind: "rant", text: "x" })).status, 400);
}));

test("journal: Unsorted counts waiting journals next to captures", () => withApi(async (a) => {
  await twoJournals(a);
  await a.call("POST", "/api/add", { client_id: "c1", text: "a loose thought", created_at: "2026-11-14T12:00:00" });
  const r = await a.call("GET", "/api/unsorted");
  assert.equal(r.data.count, 3);
  assert.deepEqual(r.data.items.map((i: { kind: string; path: string }) => [i.kind, i.path.split("/")[0]]), [["journal", "journal"], ["capture", "inbox"], ["journal", "journal"]]);
  assert.deepEqual([r.data.items[0].text, r.data.items[0].title], [MORNING.trim(), "Woke up early, and the shed"]);
}));

test("journal: a sort files bits in two subjects with links back, keeps the note whole, and one undo reverses it", () => withApi(async (a) => {
  await twoJournals(a);
  const before = [file(a.root, SHED), file(a.root, DANA), file(a.root, ONE)];
  const bits = [
    { into: SHED, when: "someday", kind: "to-do", text: "fix the shed roof leak" },
    { into: DANA, when: "note", kind: "feeling", text: "grateful she lent the ladder", about: "the ladder" },
  ];
  const r = await a.call("POST", "/api/sort", { path: ONE, bits });
  assert.equal(r.status, 200);
  assert.deepEqual([r.data.filed, r.data.kept, r.data.deleted], [[SHED, DANA], ONE, undefined]);
  const link = `from [Woke up early, and the shed](../${ONE})`;
  const shedLine = `- [ ] fix the shed roof leak · someday · ${link}`;
  const danaLine = `- 2026-11-14 · feeling · grateful she lent the ladder · about the ladder · ${link}`;
  assert.equal(file(a.root, SHED).includes(shedLine), true, `missing ${shedLine}`);
  assert.equal(file(a.root, DANA).includes(danaLine), true, `missing ${danaLine}`);
  const n = parse(file(a.root, ONE));
  assert.equal(n.body, `${MORNING}\n`);
  assert.match(String(n.meta.sorted), /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual((await a.call("GET", "/api/unsorted")).data.items.map((i: { path: string }) => i.path), [TWO]);
  assert.equal((await a.call("POST", "/api/sort", { path: ONE, bits })).status, 400);
  const log = await a.call("GET", "/api/log?n=1");
  assert.match(log.data.entries[0].msg, /^sorted journal\/2026-11-14-0930-.* into /);
  assert.equal((await a.call("POST", "/api/undo", {})).status, 200);
  assert.deepEqual([file(a.root, SHED), file(a.root, DANA), file(a.root, ONE)], before);
  assert.equal((await a.call("GET", "/api/unsorted")).data.count, 2);
}));

test("journal: a title edit keeps the link back working", () => withApi(async (a) => {
  await twoJournals(a);
  await a.call("POST", "/api/sort", { path: ONE, bits: [{ into: SHED, when: "someday", text: "fix the roof" }] });
  writeFileSync(join(a.root, ONE), file(a.root, ONE).replace("title: Woke up early, and the shed", "title: Leaky roof morning"));
  const shown = await a.call("GET", `/api/notes/${ONE}`);
  assert.equal(shown.data.title, "Leaky roof morning");
  assert.equal(file(a.root, SHED).includes(`](../${ONE})`), true, `missing link to ${ONE}`);
  assert.equal(JSON.stringify(shown.data.backlinks).includes(SHED), true, `missing backlink ${SHED}`);
}));

test("journal: brain sort --journal lists what waits, and brain sort <journal> --bits sorts it", () => withApi(async (a) => {
  await twoJournals(a);
  const brain = (...args: string[]) => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, ...args], { env: { ...process.env, BRAIN_HOME: a.root }, encoding: "utf8" });
  assert.deepEqual(JSON.parse(brain("sort", "--journal", "--json").stdout).map((w: { path: string }) => w.path), [ONE, TWO]);
  const r = brain("sort", TWO, "--bits", JSON.stringify([{ into: DANA, when: "note", text: "read two chapters" }]));
  assert.equal(r.status, 0, r.stderr);
  const chaptersLine = `read two chapters · from [Quiet night. Read two chapters](../${TWO})`;
  assert.equal(file(a.root, DANA).includes(chaptersLine), true, `missing ${chaptersLine}`);
  assert.notEqual(brain("sort", TWO, "--bits", "[]").status, 0);
}));

test("journal: a plain capture is still deleted on sort", () => withApi(async (a) => {
  assert.equal((await a.call("POST", "/api/sort", { path: "journal/none.md", into: SHED, when: "someday" })).status, 400);
  const cap = await a.call("POST", "/api/add", { client_id: "c2", text: "oil the hinges" });
  const r = await a.call("POST", "/api/sort", { path: cap.data.path, into: SHED, when: "someday" });
  assert.equal(r.data.deleted, cap.data.path);
  assert.equal(existsSync(join(a.root, cap.data.path)), false);
  assert.doesNotMatch(file(a.root, SHED), /oil the hinges · .*from /);
}));
