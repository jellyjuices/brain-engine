import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withApi } from "./api-helpers.ts";

const SHED = "projects/garden-shed.md";
const ALEX = "people/alex-sample.md";
const inboxFiles = (root: string) => readdirSync(join(root, "inbox")).filter((f) => f.endsWith(".md"));
const body = async (a: { call: Function }, path: string) => (await a.call("GET", `/api/notes/${path}`)).data.body as string;

test("add: the app's queued payload with no picks waits in the inbox, and Unsorted counts it", () => withApi(async (a) => {
  const r = await a.call("POST", "/api/inbox", { client_id: "q1", text: "a loose thought", created_at: "2026-11-05T09:00:00" });
  assert.equal(r.data.saved, "inbox");
  const unsorted = await a.call("GET", "/api/unsorted");
  assert.equal(unsorted.data.count, 1);
  assert.equal(unsorted.data.items[0].text, "a loose thought");
  assert.equal((await a.call("POST", "/api/add", { client_id: "q1", text: "a loose thought" })).data.saved, "skipped");
}));

test("add: with a person it is filed on them and no capture is left", () => withApi(async (a) => {
  const r = await a.call("POST", "/api/add", { client_id: "p1", text: "tomorrow: return the ladder", people: [ALEX] });
  assert.equal(r.status, 200);
  assert.equal(r.data.saved, "filed");
  assert.equal(r.data.path, ALEX);
  assert.match(await body(a, ALEX), /- \[ \] return the ladder · due /);
  assert.deepEqual(inboxFiles(a.root), []);
  assert.equal((await a.call("GET", "/api/unsorted")).data.count, 0);
}));

test("the app's add always lands in the inbox, even with a home, a tag or a person", () => withApi(async (a) => {
  const homed = await a.call("POST", "/api/inbox", { client_id: "h1", text: "peptide checkin", into: SHED });
  const tagged = await a.call("POST", "/api/inbox", { client_id: "h2", text: "book a physio visit", tags: ["health"] });
  assert.deepEqual([homed.data.saved, tagged.data.saved], ["inbox", "inbox"]);
  assert.match(homed.data.path, /^inbox\//);
  assert.match(tagged.data.path, /^inbox\//);
  assert.doesNotMatch(await body(a, SHED), /peptide/);
  assert.doesNotMatch(await body(a, "areas/health.md"), /physio/);
  assert.equal(inboxFiles(a.root).length, 2);
  assert.equal((await a.call("GET", "/api/unsorted")).data.count, 2);
}));

test("add: a tag files into its area, a subject pick files there with the person as · with", () => withApi(async (a) => {
  const tagged = await a.call("POST", "/api/add", { client_id: "t1", text: "book a physio visit", tags: ["health"] });
  assert.equal(tagged.data.path, "areas/health.md");
  assert.match(await body(a, "areas/health.md"), /book a physio visit/);
  const about = await a.call("POST", "/api/add", { client_id: "s1", text: "today: measure the door", about: [SHED], people: [ALEX] });
  assert.equal(about.data.path, SHED);
  assert.match(await body(a, SHED), /- \[ \] measure the door · with \[Alex Sample\]\(\.\.\/people\/alex-sample\.md\) · due /);
  assert.deepEqual(inboxFiles(a.root), []);
  assert.equal((await a.call("POST", "/api/add", { client_id: "x", text: "hi", people: "nope" })).status, 400);
}));

test("done, move and delete a to-do by ref, then read the views back", () => withApi(async (a) => {
  const all = await a.call("GET", "/api/todos?view=all");
  const refOf = (text: string) => all.data.items.find((t: { text: string }) => t.text === text).ref;
  assert.equal((await a.call("GET", "/api/todos?view=today")).data.items.length, 1);
  assert.deepEqual((await a.call("GET", "/api/todos?view=on-hold")).data.items.map((t: { text: string }) => t.text), ["Ask about the permit"]);
  assert.deepEqual((await a.call("GET", "/api/todos?view=soon")).data.items.map((t: { text: string }) => t.text), ["Pour the base"]);
  assert.equal((await a.call("POST", "/api/done", { ref: refOf("Buy cedar boards") })).status, 200);
  assert.equal((await a.call("POST", "/api/move", { ref: refOf("Pick a roof colour"), when: "2026-12-24" })).status, 200);
  assert.equal((await a.call("POST", "/api/drop", { ref: refOf("Pour the base"), why: "not needed" })).status, 200);
  const text = await body(a, SHED);
  assert.match(text, /- \[x\] Buy cedar boards/);
  assert.match(text, /- \[ \] Pick a roof colour · due 2026-12-24/);
  const open = (await a.call("GET", "/api/todos?view=all")).data.items.map((t: { text: string }) => t.text);
  assert.deepEqual(open.sort(), ["Ask about the permit", "Pick a roof colour"]);
  assert.equal((await a.call("GET", "/api/todos?view=later")).status, 400);
}));

test("sort: a capture split into two subjects is one log entry, and one undo reverses all of it", () => withApi(async (a) => {
  const cap = await a.call("POST", "/api/inbox", { client_id: "c1", text: "shed and ladder thoughts" });
  const capText = readFileSync(join(a.root, cap.data.path), "utf8");
  const before = [await body(a, SHED), await body(a, ALEX)];
  const sorted = await a.call("POST", "/api/sort", { path: cap.data.path, bits: [{ into: SHED, when: "someday", text: "paint the shed" }, { into: ALEX, when: "note", text: "lent us a ladder" }] });
  assert.equal(sorted.status, 200);
  assert.deepEqual(sorted.data.filed, [SHED, ALEX]);
  assert.equal(sorted.data.deleted, cap.data.path);
  assert.equal(existsSync(join(a.root, cap.data.path)), false);
  assert.match(await body(a, SHED), /paint the shed · someday/);
  assert.match(await body(a, ALEX), /lent us a ladder/);
  const log = await a.call("GET", "/api/log?n=1");
  assert.match(log.data.entries[0].msg, /^sorted inbox\//);
  assert.equal(log.data.entries[0].undoable, true);
  assert.equal((await a.call("POST", "/api/undo", {})).status, 200);
  assert.equal(readFileSync(join(a.root, cap.data.path), "utf8"), capText);
  assert.deepEqual([await body(a, SHED), await body(a, ALEX)], before);
  assert.equal((await a.call("GET", "/api/unsorted")).data.count, 1);
}));

test("sort: one into and a When, the app's payload; no into goes to General", () => withApi(async (a) => {
  const one = await a.call("POST", "/api/inbox", { client_id: "c2", text: "call the lumber yard" });
  const r = await a.call("POST", "/api/sort", { path: one.data.path, into: ALEX, when: "2026-12-01" });
  assert.equal(r.data.into, ALEX);
  assert.match(await body(a, ALEX), /- \[ \] call the lumber yard · due 2026-12-01/);
  const two = await a.call("POST", "/api/inbox", { client_id: "c3", text: "sort the drawer" });
  assert.equal((await a.call("POST", "/api/sort", { path: two.data.path, when: "someday" })).data.into, "areas/general.md");
  assert.equal((await a.call("POST", "/api/sort", { path: two.data.path, bits: [] })).status, 400);
}));

test("make a note from a type, link it, delete it to the archive, and undo the delete", () => withApi(async (a) => {
  const made = await a.call("POST", "/api/notes", { type: "Topic", title: "Cedar wood", description: "Notes on cedar." });
  assert.equal(made.data.created, true);
  assert.equal((await a.call("POST", "/api/notes", { type: "Topic", title: "cedar wood" })).data.created, false);
  assert.equal((await a.call("POST", "/api/notes", { type: "Capture", title: "x" })).status, 400);
  const link = await a.call("POST", "/api/relations", { from: SHED, to: made.data.path, role: "material" });
  assert.equal(link.data.created, true);
  assert.equal((await a.call("POST", "/api/relations", { from: made.data.path, to: SHED })).data.created, false);
  const rel = await a.call("GET", `/api/relations?path=${made.data.path}`);
  assert.deepEqual(rel.data.in.map((r: { from: string; role: string }) => [r.from, r.role]), [[SHED, "material"]]);
  const gone = await a.call("DELETE", `/api/notes/${made.data.path}`);
  assert.match(gone.data.archived, /^\.archive\//);
  assert.equal((await a.call("GET", `/api/notes/${made.data.path}`)).status, 404);
  await a.call("POST", "/api/undo", {});
  assert.equal((await a.call("GET", `/api/notes/${made.data.path}`)).data.title, "Cedar wood");
  assert.equal(existsSync(join(a.root, gone.data.archived)), false);
}));

test("find gives hits and the card; a write that breaks a link reports it in check", () => withApi(async (a) => {
  const found = await a.call("GET", "/api/find?q=Garden%20shed");
  assert.equal(found.data.card.subject.path, SHED);
  assert.deepEqual([SHED].filter((p) => !found.data.hits.map((h: { path: string }) => h.path).includes(p)), []);
  const note = await a.call("GET", `/api/notes/${ALEX}`);
  const edit = await a.call("PUT", `/api/notes/${ALEX}`, { body: `${note.data.body}\n- see [Nobody](nobody.md)\n`, base: note.data.hash });
  assert.equal(edit.status, 200);
  assert.deepEqual(edit.data.check.filter((i: { path: string; level: string; message: string }) => i.path === ALEX && i.level === "error" && /broken link/.test(i.message)).map((i: { path: string }) => i.path), [ALEX]);
  const clean = await a.call("POST", "/api/add", { client_id: "k1", text: "note: likes tea", about: [SHED] });
  assert.equal(clean.data.check, undefined);
}));

test("drafts: a cut-off add is saved, resumed, and cleared when the add goes through", () => withApi(async (a) => {
  const saved = await a.call("POST", "/api/drafts", { kind: "add", step: "about", data: { text: "fix the gate" } });
  assert.equal(saved.status, 200);
  const id = saved.data.id;
  assert.equal((await a.call("POST", "/api/drafts", { id, kind: "add", step: "when", data: { text: "fix the gate", about: [SHED] } })).data.created, saved.data.created);
  const list = await a.call("GET", "/api/drafts?kind=add");
  assert.deepEqual(list.data.drafts.map((d: { id: string; step: string }) => [d.id, d.step]), [[id, "when"]]);
  assert.deepEqual((await a.call("GET", `/api/drafts/${id}`)).data.data, { text: "fix the gate", about: [SHED] });
  await a.call("POST", "/api/add", { client_id: "d1", text: "fix the gate", about: [SHED], draft_id: id });
  assert.equal((await a.call("GET", `/api/drafts/${id}`)).status, 404);
  assert.equal((await a.call("POST", "/api/drafts", { kind: "nope", data: {} })).status, 400);
  assert.equal((await a.call("GET", "/api/drafts/..%2Fx")).status, 400);
}));
