import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addDays, today } from "../src/core/notes.ts";
import { loadAll } from "../src/core/files.ts";
import { smartAdd, sortCapture, splitPrefix, subjectsNamed } from "../src/capture/file.ts";
import { capture } from "../src/capture/actions.ts";
import { spawnSync } from "node:child_process";
import { BIN, makeBrain } from "./fixture.ts";

function brain(): string {
  const root = makeBrain();
  writeFileSync(join(root, "people/family-doctor.md"), "---\ntype: Person\ntitle: Dr. Test, family doctor\ndescription: My GP.\naliases: [Dr]\n---\n\n# Who\n\n# To-dos\n\n# Notes\n");
  writeFileSync(join(root, "people/omar.md"), "---\ntype: Person\ntitle: Omar\ndescription: A friend.\n---\n\n# To-dos\n");
  writeFileSync(join(root, "topics/advil.md"), "---\ntype: Topic\ntitle: Advil\ndescription: A med.\n---\n\n# Summary\n");
  return root;
}
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

test("prefixes give a When; other text has none", () => {
  const now = "2026-11-05";
  assert.deepEqual(splitPrefix("tomorrow: ask Dr", now), { when: { kind: "date", due: "2026-11-06" }, text: "ask Dr" });
  assert.deepEqual(splitPrefix("today: x", now).when, { kind: "today", due: now });
  assert.deepEqual(splitPrefix("fri: x", now).when, { kind: "date", due: "2026-11-06" });
  assert.deepEqual(splitPrefix("2026-12-01: x", now).when, { kind: "date", due: "2026-12-01" });
  assert.deepEqual(splitPrefix("someday: x", now).when, { kind: "someday", due: undefined });
  assert.deepEqual(splitPrefix("note: x", now).when, { kind: "note" });
  assert.deepEqual(splitPrefix("Re: the thing", now), { text: "Re: the thing" });
});

test('brain add "tomorrow: ask Dr about Advil" names a person, so it stays out of the doctor note', () => {
  const root = brain();
  const r = smartAdd(root, loadAll(root), "tomorrow: ask Dr about Advil");
  assert.equal(r.filed, false);
  assert.doesNotMatch(read(root, "people/family-doctor.md"), /ask Dr about Advil/);
});

test('brain add "tomorrow: read up on Advil" files it in the Advil note', () => {
  const root = brain();
  const r = smartAdd(root, loadAll(root), "tomorrow: read up on Advil");
  assert.equal(r.filed && r.into, "topics/advil.md");
  assert.match(read(root, "topics/advil.md"), new RegExp(`- \\[ \\] read up on Advil · due ${addDays(today(), 1)}`));
  assert.equal(readdirSync(join(root, "inbox")).length, 0);
});

test("brain add without a prefix or a match goes to the inbox with a guess", () => {
  const root = brain();
  const a = smartAdd(root, loadAll(root), "call Omar back");
  assert.equal(a.filed, false);
  assert.notEqual(!a.filed && a.guess, "people/omar.md");
  const b = smartAdd(root, loadAll(root), "tomorrow: buy milk");
  assert.equal(b.filed, false);
  const d = smartAdd(root, loadAll(root), "tomorrow: call Omar back");
  assert.equal(d.filed, false);
  assert.doesNotMatch(read(root, "people/omar.md"), /call Omar back/);
  const c = smartAdd(root, loadAll(root), "note: Omar moved to Vancouver");
  assert.equal(c.filed, true);
  assert.match(read(root, "people/omar.md"), new RegExp(`- ${today()} · Omar moved to Vancouver`));
});

test("one-step sort writes the line with · with, and deletes the capture, with nothing left in the archive", () => {
  const root = brain();
  const cap = capture(root, { text: "Ask Dr about Advil with Omar" });
  const notes = loadAll(root);
  assert.deepEqual(subjectsNamed(notes, "Ask Dr about Advil with Omar").map((n) => n.path), ["people/family-doctor.md", "people/omar.md", "topics/advil.md"]);
  const r = sortCapture(root, notes, cap.path, "people/family-doctor.md", { kind: "waiting" }, { with: ["people/omar.md"] });
  assert.match(read(root, "people/family-doctor.md"), /- \[ \] Ask Dr about Advil with Omar · with \[Omar\]\(omar\.md\) · waiting/);
  assert.equal(r.deleted, cap.path);
  assert.equal(existsSync(join(root, cap.path)), false);
  assert.deepEqual(readdirSync(join(root, ".archive")), []);
});

test("brain undo puts a sorted capture back and takes the filed lines out", () => {
  const root = brain();
  const cap = capture(root, { text: "Ask Dr about Advil with Omar" });
  const before = read(root, "people/family-doctor.md");
  sortCapture(root, loadAll(root), cap.path, "people/family-doctor.md", { kind: "waiting" }, { with: ["people/omar.md"] });
  assert.equal(existsSync(join(root, cap.path)), false);
  const r = spawnSync("node", [BIN, "undo"], { cwd: root, env: { ...process.env, BRAIN_HOME: root, NO_COLOR: "1" }, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Undone: sorted /);
  assert.equal(existsSync(join(root, cap.path)), true);
  assert.match(read(root, cap.path), /Ask Dr about Advil with Omar/);
  assert.equal(read(root, "people/family-doctor.md"), before);
  assert.doesNotMatch(read(root, "people/omar.md"), /Advil/);
});

test('"Not a to-do" writes a dated note line', () => {
  const root = brain();
  const cap = capture(root, { text: "Advil lasts 12 hours", createdAt: "2026-11-01T09:00" });
  sortCapture(root, loadAll(root), cap.path, "topics/advil.md", { kind: "note" });
  assert.match(read(root, "topics/advil.md"), /# Notes\n\n- 2026-11-01 · Advil lasts 12 hours/);
});
