import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { apiBrain, startApi } from "./api-helpers.ts";

const SHED = "projects/garden-shed.md";
const ALEX = "people/alex-sample.md";

async function filed(api: Awaited<ReturnType<typeof startApi>>) {
  const added = await api.call("POST", "/api/add", { client_id: "s1-a", text: "tomorrow: call the roofer", into: SHED });
  assert.equal(added.status, 200);
  const note = await api.call("POST", "/api/add", { client_id: "s1-b", text: "The shed door sticks", into: SHED, kind: "fact" });
  assert.equal(note.status, 200);
}

test("S1: sorted lists filed lines by subject with kind and check", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await filed(api);
  await api.call("POST", "/api/add", { client_id: "s1-c", text: "The gate latch is loose · check", into: SHED, kind: "fact" });
  const res = await api.call("GET", "/api/sorted");
  assert.equal(res.status, 200);
  assert.equal(res.data.subjects.length, 1);
  const kinds = res.data.subjects[0].lines.map((l: { kind: string; check: boolean }) => `${l.kind}:${l.check}`);
  assert.deepEqual(kinds.sort(), ["fact:false", "fact:true", "to-do:false"]);
});

test("S1: moving a line that carries check clears the mark", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await api.call("POST", "/api/add", { client_id: "s1-c", text: "The gate latch is loose · check", into: SHED, kind: "fact" });
  const unsure = (await api.call("GET", "/api/sorted")).data.subjects[0].lines[0];
  const moved = await api.call("POST", "/api/move-line", { path: SHED, line: unsure.line, into: ALEX });
  assert.equal(moved.status, 200);
  assert.doesNotMatch(readFileSync(join(root, ALEX), "utf8"), /check/);
});

test("S1: move-line moves a line, clears check, logs, and undoes", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await filed(api);
  const before = (await api.call("GET", "/api/sorted")).data.subjects[0].lines.find((l: { kind: string }) => l.kind === "to-do");
  const file = join(root, SHED);
  const moved = await api.call("POST", "/api/move-line", { path: SHED, line: before.line, into: ALEX });
  assert.equal(moved.status, 200);
  assert.ok(moved.data.undo_id);
  assert.match(readFileSync(join(root, ALEX), "utf8"), /call the roofer/);
  assert.doesNotMatch(readFileSync(file, "utf8"), /call the roofer/);
  const sorted = (await api.call("GET", "/api/sorted")).data;
  assert.ok(sorted.subjects.some((s: { path: string }) => s.path === ALEX));
  const log = await api.call("GET", "/api/log");
  assert.match(log.data.entries?.[0]?.msg ?? JSON.stringify(log.data), /moved to people\/alex-sample\.md/);
  const undone = await api.call("POST", "/api/undo", { id: moved.data.undo_id });
  assert.equal(undone.status, 200);
  assert.match(readFileSync(file, "utf8"), /call the roofer/);
  assert.doesNotMatch(readFileSync(join(root, ALEX), "utf8"), /call the roofer/);
});

const BAD_MOVES: [string, (line: string) => Record<string, unknown>, number, RegExp][] = [
  ["a line that is not in the note", () => ({ path: SHED, line: "- [ ] not here", into: ALEX }), 400, /not in/],
  ["the same subject", (line) => ({ path: SHED, line, into: SHED }), 400, /already/],
  ["a path with ../", (line) => ({ path: "projects/../people/alex-sample.md", line, into: ALEX }), 400, /not valid/],
  ["an absolute path", (line) => ({ path: "/etc/passwd.md", line, into: ALEX }), 400, /not valid/],
  ["a missing into", (line) => ({ path: SHED, line }), 400, /Missing "into"/],
  ["a blank line", () => ({ path: SHED, line: "", into: ALEX }), 400, /Missing "line"/],
  ["a target note that does not exist", (line) => ({ path: SHED, line, into: "people/nobody.md" }), 404, /No note/],
];

for (const [name, body, status, message] of BAD_MOVES) {
  test(`S1: move-line with ${name} is ${status} and changes nothing`, async (t) => {
    const root = apiBrain();
    const api = await startApi({}, root);
    t.after(() => api.close());
    await filed(api);
    const line = (await api.call("GET", "/api/sorted")).data.subjects[0].lines.find((l: { kind: string }) => l.kind === "to-do").line;
    const before = readFileSync(join(root, SHED), "utf8");
    const res = await api.call("POST", "/api/move-line", body(line));
    assert.deepEqual({ status: res.status, error: res.data.error }, { status, error: res.data.error });
    assert.match(res.data.error, message);
    assert.equal(readFileSync(join(root, SHED), "utf8"), before);
  });
}

test("S1: undoing a move puts the check mark back", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await api.call("POST", "/api/add", { client_id: "s1-c", text: "The gate latch is loose · check", into: SHED, kind: "fact" });
  const unsure = (await api.call("GET", "/api/sorted")).data.subjects[0].lines[0];
  const moved = await api.call("POST", "/api/move-line", { path: SHED, line: unsure.line, into: ALEX });
  await api.call("POST", "/api/undo", { id: moved.data.undo_id });
  assert.match(readFileSync(join(root, SHED), "utf8"), /The gate latch is loose · check/);
});

test("S1: undoing a move restores a relative link as it was", async (t) => {
  const root = apiBrain();
  writeFileSync(join(root, "projects/pergola.md"), "---\ntype: Project\ntitle: Pergola\ndescription: A shade frame.\n---\n\n# To-dos\n\n# Notes\n");
  const api = await startApi({}, root);
  t.after(() => api.close());
  await api.call("POST", "/api/add", { client_id: "s1-d", text: "tomorrow: stain the Pergola rails", into: SHED });
  const linked = (await api.call("GET", "/api/sorted")).data.subjects[0].lines.find((l: { text: string }) => l.text === "stain the Pergola rails");
  assert.match(linked.line, /\]\(pergola\.md\)/);
  const moved = await api.call("POST", "/api/move-line", { path: SHED, line: linked.line, into: ALEX });
  assert.match(readFileSync(join(root, ALEX), "utf8"), /\]\(\.\.\/projects\/pergola\.md\)/);
  await api.call("POST", "/api/undo", { id: moved.data.undo_id });
  assert.match(readFileSync(join(root, SHED), "utf8"), /stain the Pergola rails.*\]\(pergola\.md\)/);
});

test("S1: undoing a retag puts the line back", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await filed(api);
  const fact = (await api.call("GET", "/api/sorted")).data.subjects[0].lines.find((l: { kind: string }) => l.kind === "fact");
  const retagged = await api.call("POST", "/api/retag", { path: SHED, line: fact.line, tag: "home" });
  await api.call("POST", "/api/undo", { id: retagged.data.undo_id });
  assert.match(readFileSync(join(root, SHED), "utf8"), /The shed door sticks/);
  assert.doesNotMatch(readFileSync(join(root, "areas/home.md"), "utf8"), /The shed door sticks/);
});

test("S1: retag moves a note line to the area for the tag", async (t) => {
  const root = apiBrain();
  const api = await startApi({}, root);
  t.after(() => api.close());
  await filed(api);
  const fact = (await api.call("GET", "/api/sorted")).data.subjects[0].lines.find((l: { kind: string }) => l.kind === "fact");
  const res = await api.call("POST", "/api/retag", { path: SHED, line: fact.line, tag: "home" });
  assert.equal(res.status, 200);
  assert.equal(res.data.into, "areas/home.md");
  assert.match(readFileSync(join(root, "areas/home.md"), "utf8"), /The shed door sticks/);
  assert.equal((await api.call("POST", "/api/retag", { path: "areas/home.md", line: res.data.line, tag: "no-such-tag" })).status, 400);
});
