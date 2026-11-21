import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, parse, today } from "../src/core/notes.ts";
import { apiBrain, withApi } from "./api-helpers.ts";

const SHED = "projects/garden-shed.md";
const file = (root: string, path: string) => readFileSync(join(root, path), "utf8");

test("drafts older than 14 days are thrown away", () => withApi(async (a) => {
  const dir = join(a.root, ".brain", "drafts");
  mkdirSync(dir, { recursive: true });
  const old = { id: "old", kind: "add", data: {}, created: "2026-01-01T09:00:00", updated: "2026-01-01T09:00:00" };
  writeFileSync(join(dir, "old.json"), JSON.stringify(old));
  const fresh = await a.call("POST", "/api/drafts", { kind: "add", data: { text: "x" } });
  const list = await a.call("GET", "/api/drafts");
  assert.deepEqual(list.data.drafts.map((d: { id: string }) => d.id), [fresh.data.id]);
  assert.equal(existsSync(join(dir, "old.json")), false);
}));

test("add with when and kind todo writes a to-do with a due date, text as typed", () => withApi(async (a) => {
  const r = await a.call("POST", "/api/add", { client_id: "w1", text: "Call the plumber", kind: "todo", into: SHED, when: "tomorrow" });
  assert.equal(r.data.saved, "filed");
  assert.match(file(a.root, SHED), new RegExp(`- \\[ \\] Call the plumber · due ${addDays(today(), 1)}\\n`));
  const bare = await a.call("POST", "/api/add", { client_id: "w2", text: "Sand the door", kind: "todo", into: SHED });
  assert.equal(bare.data.saved, "filed");
  assert.match(file(a.root, SHED), /- \[ \] Sand the door\n/);
  assert.equal((await a.call("POST", "/api/add", { client_id: "w3", text: "x", when: "nonsense" })).status, 400);
  await a.call("POST", "/api/add", { client_id: "w1", text: "Call the plumber", kind: "todo", into: SHED, when: "tomorrow" });
  assert.equal(file(a.root, SHED).split("Call the plumber").length, 2);
}));

test("add with kind fact and kind feeling writes one dated line", () => withApi(async (a) => {
  const fact = await a.call("POST", "/api/add", { client_id: "f1", text: "The permit is approved", kind: "fact", into: SHED });
  assert.equal(fact.data.saved, "filed");
  assert.match(file(a.root, SHED), new RegExp(`- ${today()} · The permit is approved\\n`));
  const feel = await a.call("POST", "/api/add", { client_id: "f2", text: "Relieved", kind: "feeling", into: SHED, about: "the permit" });
  assert.equal(feel.data.saved, "filed");
  assert.match(file(a.root, SHED), new RegExp(`- ${today()} · feeling · Relieved · about the permit\\n`));
  assert.equal((await a.call("POST", "/api/add", { client_id: "f3", text: "x", kind: "fact" })).status, 400);
}));

test("edit_note changes a journal title and keeps the path", () => withApi(async (a) => {
  const j = await a.call("POST", "/api/journal", { date: "2026-11-14", text: "Quiet day at the shed.", created_at: "2026-11-14T10:00:00" });
  assert.equal(j.data.title, "Quiet day at the shed");
  const read = await a.call("GET", `/api/notes/${j.data.path}`);
  const edit = await a.call("PUT", `/api/notes/${j.data.path}`, { base: read.data.hash, title: "Shed day" });
  assert.equal(edit.status, 200);
  assert.equal(edit.data.path, j.data.path);
  assert.equal(parse(file(a.root, j.data.path)).meta.title, "Shed day");
  const proj = await a.call("GET", `/api/notes/${SHED}`);
  assert.equal((await a.call("PUT", `/api/notes/${SHED}`, { base: proj.data.hash, title: "Other" })).status, 400);
}));

test("add_journal with a client_id makes no copy on a retry, even with edited text", () => withApi(async (a) => {
  const one = await a.call("POST", "/api/journal", { date: "2026-11-14", text: "First words.", client_id: "j9", created_at: "2026-11-14T08:00:00" });
  const two = await a.call("POST", "/api/journal", { date: "2026-11-14", text: "First words, then more.", client_id: "j9", created_at: "2026-11-14T08:00:00" });
  assert.equal(one.data.created, true);
  assert.deepEqual([two.data.created, two.data.path, two.data.title], [false, one.data.path, one.data.title]);
}));

test("make_note takes fields, areas, parent, sections, relations and todos in one write, and one undo removes it", () => withApi(async (a) => {
  await a.call("POST", "/api/notes", { type: "Goal", title: "Run far", areas: ["fitness"] });
  const r = await a.call("POST", "/api/notes", {
    type: "Goal",
    title: "Warm up",
    description: "Loosen up first.",
    fields: { why: "Fewer injuries", status: "active" },
    areas: ["health", "fitness"],
    parent: "run-far",
    sections: { "# Targets": ["- [ ] Stretch daily"] },
    relations: [{ to: "people/alex-sample.md", role: "sample role" }],
    todos: ["Buy a mat", { text: "Book a class", when: "tomorrow" }],
  });
  assert.equal(r.status, 200);
  const n = parse(file(a.root, r.data.path));
  assert.deepEqual([n.meta.why, n.meta.areas, n.meta.parent], ["Fewer injuries", ["health", "fitness"], "run-far"]);
  assert.match(n.body, /# Targets\n\n- \[ \] Stretch daily/);
  assert.match(n.body, /# People\n\n- \[Alex Sample\]\(\.\.\/people\/alex-sample\.md\) · sample role/);
  assert.match(n.body, new RegExp(`# To-dos\\n\\n- \\[ \\] Buy a mat\\n- \\[ \\] Book a class · due ${addDays(today(), 1)}`));
  const undo = await a.call("POST", "/api/undo");
  assert.equal(undo.status, 200);
  assert.equal(existsSync(join(a.root, r.data.path)), false);
}));

test("make_note refuses bad fields, areas and parents", () => withApi(async (a) => {
  const make = (extra: object) => a.call("POST", "/api/notes", { type: "Goal", title: "Bad one", ...extra });
  assert.equal((await make({ fields: { colour: "red" } })).status, 400);
  assert.equal((await make({ fields: { decide_by: "soon" } })).status, 400);
  assert.equal((await make({ fields: { status: "nope" } })).status, 400);
  assert.equal((await make({ areas: ["nowhere"] })).status, 400);
  assert.equal((await make({ parent: "missing" })).status, 400);
  assert.equal((await make({ relations: [{ to: "people/nobody.md" }] })).status, 400);
  assert.equal(existsSync(join(a.root, "goals/bad-one.md")), false);
}));

test("a project is made with a goal link and a first to-do in one call", () => withApi(async (a) => {
  const goal = await a.call("POST", "/api/notes", { type: "Goal", title: "Tidy yard" });
  const r = await a.call("POST", "/api/notes", { type: "Project", title: "Yard sale", areas: ["home"], relations: [{ to: goal.data.path }], todos: ["List the old tools"] });
  const n = parse(file(a.root, r.data.path));
  assert.deepEqual(n.meta.areas, ["home"]);
  assert.match(n.body, /# Goals\n\n- \[Tidy yard\]\(\.\.\/goals\/tidy-yard\.md\)/);
  assert.match(n.body, /# To-dos\n\n- \[ \] List the old tools/);
}));

test("a new area gets the next unused colour", () => withApi(async (a) => {
  const one = await a.call("POST", "/api/notes", { type: "Area", title: "Garden" });
  const two = await a.call("POST", "/api/notes", { type: "Area", title: "Pets" });
  const colours = [one, two].map((r) => parse(file(a.root, r.data.path)).meta.color);
  assert.notEqual(colours[0], colours[1]);
  assert.deepEqual(colours.filter((c) => typeof c !== "string" || c === ""), []);
}));

test("a project can be marked finished, and an old stable project reads as active", () => withApi(async (a) => {
  const read = await a.call("GET", `/api/notes/${SHED}`);
  const done = await a.call("PUT", `/api/notes/${SHED}`, { base: read.data.hash, status: "finished" });
  assert.equal(done.status, 200);
  assert.equal(parse(file(a.root, SHED)).meta.status, "finished");
  assert.equal((await a.call("PUT", `/api/notes/${SHED}`, { base: done.data.hash, status: "stable" })).status, 200);
  assert.equal((await a.call("PUT", `/api/notes/${SHED}`, { base: (await a.call("GET", `/api/notes/${SHED}`)).data.hash, status: "bogus" })).status, 400);
}));

test("the event template says What happened, not Outcome", () => {
  const root = apiBrain();
  assert.match(file(root, ".templates/event.md"), /# What happened/);
  assert.doesNotMatch(file(root, ".templates/event.md"), /# Outcome/);
});
