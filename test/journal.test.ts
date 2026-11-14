import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withApi } from "./api-helpers.ts";
import { entriesOf } from "../src/capture/journal.ts";
import { parse } from "../src/core/notes.ts";

const SHED = "projects/garden-shed.md";
const DANA = "people/dana-cole.md";
const DAY = "journal/2026-11-14.md";
const MORNING = "Woke up early and the shed roof leaks again.\n\n  Dana lent us her ladder,   which was kind.";
const EVENING = "Quiet night. Read two chapters.";
const file = (root: string, path: string) => readFileSync(join(root, path), "utf8");

async function twoEntries(a: { call: Function }) {
  const one = await a.call("POST", "/api/add", { client_id: "j1", kind: "journal", text: MORNING, created_at: "2026-11-14T09:30:00" });
  const two = await a.call("POST", "/api/journal", { date: "2026-11-14", title: "", text: EVENING, created_at: "2026-11-14T21:05:00" });
  return { one, two };
}

test("journal: two adds on one day land whole under two time headings in one day note", () => withApi(async (a) => {
  const { one, two } = await twoEntries(a);
  assert.deepEqual([one.data.saved, one.data.path, one.data.check, two.data.check], ["journal", DAY, undefined, undefined]);
  assert.deepEqual([two.data.path, two.data.entry, two.data.created], [DAY, `${DAY}#2105`, true]);
  const { meta, body } = parse(file(a.root, DAY));
  assert.equal(meta.type, "Daily");
  assert.equal(meta.title, "2026-11-14");
  assert.match(body, new RegExp(`# Journal\\n\\n## 09:30\\n\\n· to sort\\n\\n${MORNING.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\n## 21:05\\n\\n· to sort\\n\\n${EVENING}\\n$`));
  assert.deepEqual(entriesOf(DAY, body).map((e) => [e.ref, e.text]), [[`${DAY}#0930`, MORNING], [`${DAY}#2105`, EVENING]]);
  assert.equal((await a.call("POST", "/api/add", { client_id: "j1", kind: "journal", text: MORNING })).data.saved, "skipped");
  assert.equal((await a.call("POST", "/api/journal", { date: "2026-11-14", text: EVENING })).data.created, false);
  const same = await a.call("POST", "/api/add", { client_id: "j3", kind: "journal", text: "A second thought that minute.", created_at: "2026-11-14T09:30:40" });
  assert.equal(same.status, 200);
  assert.ok(entriesOf(DAY, parse(file(a.root, DAY)).body).some((e) => e.ref === `${DAY}#0930-2`));
  assert.equal((await a.call("POST", "/api/add", { client_id: "j4", kind: "rant", text: "x" })).status, 400);
}));

test("journal: Unsorted counts waiting entries next to captures", () => withApi(async (a) => {
  await twoEntries(a);
  await a.call("POST", "/api/add", { client_id: "c1", text: "a loose thought", created_at: "2026-11-14T12:00:00" });
  const r = await a.call("GET", "/api/unsorted");
  assert.equal(r.data.count, 3);
  assert.deepEqual(r.data.items.map((i: { kind: string; path: string }) => i.kind), ["journal", "capture", "journal"]);
  assert.equal(r.data.items[0].path, `${DAY}#0930`);
  assert.equal(r.data.items[0].text, MORNING);
}));

test("journal: a sort files bits in two subjects with links back, keeps the entry whole, and one undo reverses it", () => withApi(async (a) => {
  await twoEntries(a);
  const before = [file(a.root, SHED), file(a.root, DANA), file(a.root, DAY)];
  const bits = [
    { into: SHED, when: "someday", kind: "to-do", text: "fix the shed roof leak" },
    { into: DANA, when: "note", kind: "feeling", text: "grateful she lent the ladder", about: "the ladder" },
  ];
  const r = await a.call("POST", "/api/sort", { path: `${DAY}#0930`, bits });
  assert.equal(r.status, 200);
  assert.deepEqual([r.data.filed, r.data.kept, r.data.deleted], [[SHED, DANA], `${DAY}#0930`, undefined]);
  const link = "from [2026-11-14 09:30](../journal/2026-11-14.md#0930)";
  assert.match(file(a.root, SHED), new RegExp(`- \\[ \\] fix the shed roof leak · someday · ${link.replace(/[[\]().#]/g, "\\$&")}`));
  assert.ok(file(a.root, DANA).includes(`- 2026-11-14 · feeling · grateful she lent the ladder · about the ladder · ${link}`));
  const entries = entriesOf(DAY, parse(file(a.root, DAY)).body);
  assert.equal(entries[0].text, MORNING);
  assert.equal(entries[0].waiting, false);
  assert.match(file(a.root, DAY), /## 09:30\n\n· sorted \d{4}-\d{2}-\d{2}\n/);
  assert.deepEqual((await a.call("GET", "/api/unsorted")).data.items.map((i: { path: string }) => i.path), [`${DAY}#2105`]);
  assert.equal((await a.call("POST", "/api/sort", { path: `${DAY}#0930`, bits })).status, 400);
  const log = await a.call("GET", "/api/log?n=1");
  assert.match(log.data.entries[0].msg, /^sorted journal\/2026-11-14\.md#0930 into /);
  assert.equal((await a.call("POST", "/api/undo", {})).status, 200);
  assert.deepEqual([file(a.root, SHED), file(a.root, DANA), file(a.root, DAY)], before);
  assert.equal((await a.call("GET", "/api/unsorted")).data.count, 2);
}));

test("journal: a bad entry ref is refused, and a plain capture is still deleted on sort", () => withApi(async (a) => {
  assert.equal((await a.call("POST", "/api/sort", { path: "journal/2026-11-14.md#soon", into: SHED, when: "someday" })).status, 400);
  assert.equal((await a.call("POST", "/api/sort", { path: `${DAY}#0930`, into: SHED, when: "someday" })).status, 400);
  const cap = await a.call("POST", "/api/add", { client_id: "c2", text: "oil the hinges" });
  const r = await a.call("POST", "/api/sort", { path: cap.data.path, into: SHED, when: "someday" });
  assert.equal(r.data.deleted, cap.data.path);
  assert.ok(!existsSync(join(a.root, cap.data.path)));
  assert.doesNotMatch(file(a.root, SHED), /oil the hinges · .*from /);
}));
