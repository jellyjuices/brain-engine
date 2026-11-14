import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { addDays, today } from "../src/core/notes.ts";
import { readLog } from "../src/core/log.ts";
import { done, drop, move } from "../src/todos/verbs.ts";
import { dayList, ref } from "../src/todos/day-list.ts";
import { undo } from "../src/todos/undo.ts";
import { parseWhen } from "../src/todos/when-words.ts";
import { BIN, makeBrain } from "./fixture.ts";

const now = today();
const yesterday = addDays(now, -1);

function brainWithTodos(): string {
  const root = makeBrain();
  writeFileSync(join(root, "projects/visit.md"), `---\ntype: Project\ntitle: Family doctor visit\ndescription: A visit.\n---\n\n# To-dos\n\n- [ ] Ask about Advil · re [Sleep](../topics/sleep.md) · due ${now} · today\n- [ ] Book the sleep test · due ${yesterday}\n- [ ] Hear back from Omar · waiting\n- [ ] Pay rent · due ${now} · every month\n- [ ] Later thing · someday\n`);
  return root;
}
const file = (root: string) => readFileSync(join(root, "projects/visit.md"), "utf8");

test("brain lists overdue, today, then waiting, numbered, and saves the list", () => {
  const root = brainWithTodos();
  const items = dayList(root);
  assert.deepEqual(items.map((x) => [x.n, x.group, x.text]), [
    [1, "overdue", "Book the sleep test"],
    [2, "today", "Ask about Advil"],
    [3, "today", "Pay rent"],
    [4, "waiting", "Hear back from Omar"],
  ]);
  assert.ok(JSON.parse(readFileSync(join(root, ".brain/last-list.json"), "utf8")).length === 4);
});

test("done by number ticks the line, keeps its parts, and undo puts it back", () => {
  const root = brainWithTodos();
  dayList(root);
  const before = file(root);
  const r = done(root, "2");
  assert.equal(r.line, "Done: Ask about Advil · Family doctor visit · brain undo");
  assert.match(file(root), new RegExp(`- \\[x\\] Ask about Advil · re \\[Sleep\\]\\(\\.\\./topics/sleep\\.md\\) · due ${now} · today · done ${now}`));
  undo(root);
  assert.equal(file(root), before);
  assert.throws(() => undo(root), /Nothing to undo/);
});

test("done on a repeating to-do adds the next one, and undo removes it", () => {
  const root = brainWithTodos();
  const before = file(root);
  const r = done(root, "rent");
  assert.ok(r.next);
  assert.match(file(root), new RegExp(`- \\[ \\] Pay rent · due ${r.next} · every month`));
  undo(root);
  assert.equal(file(root), before);
});

test("move sets the due date and token; drop ticks and marks dropped; undo reverses each in turn", () => {
  const root = brainWithTodos();
  dayList(root);
  const before = file(root);
  assert.equal(move(root, "1", "tomorrow").line, `Moved: Book the sleep test · Family doctor visit → tomorrow · brain undo`);
  assert.match(file(root), new RegExp(`- \\[ \\] Book the sleep test · due ${addDays(now, 1)}`));
  const afterMove = file(root);
  drop(root, "4");
  assert.match(file(root), new RegExp(`- \\[x\\] Hear back from Omar · waiting · done ${now} · dropped`));
  undo(root);
  assert.equal(file(root), afterMove);
  undo(root);
  assert.equal(file(root), before);
  assert.equal(readLog(root).filter((e) => e.undoes).length, 2);
  move(root, "Later", "today");
  assert.match(file(root), new RegExp(`- \\[ \\] Later thing · due ${now} · today`));
});

test("undo refuses when the line changed since", () => {
  const root = brainWithTodos();
  done(root, "Advil");
  writeFileSync(join(root, "projects/visit.md"), file(root).replace("[x] Ask about Advil", "[x] Ask about Advil edited"));
  assert.throws(() => undo(root), /changed since/);
});

test("when words map to dates and tokens", () => {
  assert.deepEqual(parseWhen("today", "2026-11-05"), { due: "2026-11-05", outcome: "today", label: "today" });
  assert.equal(parseWhen("fri", "2026-11-05").due, "2026-11-06"); // a Thursday
  assert.equal(parseWhen("thu", "2026-11-05").due, "2026-11-12");
  assert.deepEqual(parseWhen("someday"), { outcome: "someday", label: "someday" });
  assert.throws(() => parseWhen("soon"));
});

test("brain help is 10 lines or fewer and names the six verbs", () => {
  const r = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "help"], { encoding: "utf8", env: { ...process.env, NO_COLOR: "1" } });
  const lines = r.stdout.trimEnd().split("\n");
  assert.ok(lines.length <= 10, `help has ${lines.length} lines`);
  for (const v of ["add", "done", "move", "delete", "find"]) assert.match(r.stdout, new RegExp(`brain ${v}`));
  const all = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "help", "--all"], { encoding: "utf8" });
  assert.match(all.stdout, /brain menu/);
});

// ---- R9: what happened, follow-up, why ----

import { doneWith, dropWith, linkText, namedSubjects } from "../src/todos/wrapup.ts";
import { loadAll } from "../src/core/files.ts";

test("done with an answer writes a dated note line right under the ticked to-do, and undo reverses it", () => {
  const root = brainWithTodos();
  const before = file(root);
  doneWith(root, "Ask about Advil", { happened: "Dr said try 20 mg." });
  const lines = file(root).split("\n");
  const i = lines.findIndex((l) => l.startsWith("- [x] Ask about Advil"));
  assert.equal(lines[i + 1], `- ${now} · Dr said try 20 mg.`);
  undo(root);
  assert.equal(file(root), before);
});

test("done with a follow-up adds a to-do in the same subject, with the brain add prefixes", () => {
  const root = brainWithTodos();
  const before = file(root);
  const r = doneWith(root, "Ask about Advil", { happened: "Needs a test", follow_up: "tomorrow: Call back about the test" });
  assert.equal(r.followUp?.as, "to-do");
  const text = file(root);
  assert.match(text, new RegExp(`- \\[ \\] Call back about the test · due ${addDays(now, 1)}`));
  assert.match(text, /- \[x\] Ask about Advil/);
  // No prefix means today.
  doneWith(root, "Book the sleep test", { follow_up: "Pick up the results" });
  assert.match(file(root), new RegExp(`- \\[ \\] Pick up the results · due ${now} · today|- \\[ \\] Pick up the results · today`));
  // One undo per done: the tick, the note and the follow-up go together.
  undo(root);
  undo(root);
  assert.equal(file(root), before);
});

test("done with blank answers writes only the tick", () => {
  const root = brainWithTodos();
  const a = file(root);
  doneWith(root, "Later thing", { happened: "  ", follow_up: "" });
  const lines = file(root).split("\n");
  assert.equal(lines.filter((l) => l.startsWith("- ")).length, a.split("\n").filter((l) => l.startsWith("- ")).length);
  assert.ok(lines.includes(`- [x] Later thing · someday · done ${now}`));
});

test("drop with a reason writes a note line", () => {
  const root = brainWithTodos();
  const before = file(root);
  dropWith(root, "Later thing", "No longer needed");
  const lines = file(root).split("\n");
  const i = lines.findIndex((l) => l.startsWith("- [x] Later thing"));
  assert.equal(lines[i + 1], `- ${now} · No longer needed`);
  undo(root);
  assert.equal(file(root), before);
});

test("a subject named by its exact title is offered for a link", () => {
  const root = brainWithTodos();
  writeFileSync(join(root, "topics/sleep.md"), "---\ntype: Topic\ntitle: Sleep\ndescription: Sleep facts.\n---\n\n# Notes\n");
  const notes = loadAll(root);
  assert.deepEqual(namedSubjects(notes, "Read about Sleep tonight", "projects/visit.md").map((n) => n.path), ["topics/sleep.md"]);
  assert.deepEqual(namedSubjects(notes, "Read about it tonight", "projects/visit.md"), []);
});

test("linkText links the first mention with a relative path", () => {
  const fake = { path: "people/omar.md", meta: { type: "Person", title: "Omar" }, body: "", mtime: 0, links: [] };
  assert.equal(linkText("Talked to Omar and Omar agreed", "projects/visit.md", fake), "Talked to [Omar](../people/omar.md) and Omar agreed");
});

test("with --json nothing is asked and the answers stay empty", () => {
  const root = brainWithTodos();
  const r = spawnSync("node", [BIN, "done", "Later thing", "--json"], { cwd: root, env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8", input: "" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(file(root).split("\n").includes(`- [x] Later thing · someday · done ${now}`));
});

test("done and move accept a stable path::text ref, and fail clearly when it is gone", () => {
  const root = brainWithTodos();
  dayList(root);
  const r = ref("projects/visit.md", "Book the sleep test");
  move(root, r, "tomorrow");
  assert.match(file(root), new RegExp(`- \\[ \\] Book the sleep test · due ${addDays(now, 1)}`));
  const d = done(root, ref("projects/visit.md", "Later thing"));
  assert.match(d.line, /^Done: Later thing/);
  assert.match(file(root), /- \[x\] Later thing/);
  assert.throws(() => done(root, ref("projects/visit.md", "Later thing")), /gone/);
});

test("put on hold: who links a Person note, what links a Thing; a new name makes the note", async () => {
  const root = brainWithTodos();
  move(root, ref("projects/visit.md", "Book the sleep test"), "waiting", { who: "Dad" });
  assert.match(file(root), /- \[ \] Book the sleep test · with \[Dad\]\(\.\.\/people\/dad\.md\) · waiting/);
  assert.ok(existsSync(join(root, "people/dad.md")));
  move(root, ref("projects/visit.md", "Later thing"), "waiting", { what: "New tires" });
  assert.match(file(root), /- \[ \] Later thing · re \[New tires\]\(\.\.\/things\/new-tires\.md\) · waiting/);
  move(root, ref("projects/visit.md", "Later thing"), "waiting", { what: "new tires" });
  assert.equal(file(root).match(/New tires/g)?.length, 1, "an existing note is found, not made twice");
});
