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

test("the day list shows overdue, today, then waiting, numbered", () => {
  const root = brainWithTodos();
  const items = dayList(root);
  assert.deepEqual(items.map((x) => [x.n, x.group, x.text]), [
    [1, "overdue", "Book the sleep test"],
    [2, "today", "Ask about Advil"],
    [3, "today", "Pay rent"],
    [4, "waiting", "Hear back from Omar"],
  ]);
});

test("done by words ticks the line, keeps its parts, and undo puts it back", () => {
  const root = brainWithTodos();
  const before = file(root);
  const r = done(root, "Advil");
  assert.equal(r.line, "Done: Ask about Advil · Family doctor visit · undo");
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
  const before = file(root);
  assert.equal(move(root, "sleep test", "tomorrow").line, `Moved: Book the sleep test · Family doctor visit → tomorrow · undo`);
  assert.match(file(root), new RegExp(`- \\[ \\] Book the sleep test · due ${addDays(now, 1)}`));
  const afterMove = file(root);
  drop(root, "Hear back");
  assert.match(file(root), new RegExp(`- \\[x\\] Hear back from Omar · waiting · done ${now} · dropped`));
  undo(root);
  assert.equal(file(root), afterMove);
  undo(root);
  assert.equal(file(root), before);
  assert.equal(readLog(root).filter((e) => e.undoes).length, 2);
  move(root, "Later", "today");
  assert.match(file(root), new RegExp(`- \\[ \\] Later thing · due ${now}\\n`));
});

test("moving to today writes due with today's date and clears old marks", () => {
  const root = brainWithTodos();
  move(root, "Hear back", "today");
  assert.match(file(root), new RegExp(`- \\[ \\] Hear back from Omar · due ${now}\\n`));
  assert.doesNotMatch(file(root), /Hear back from Omar[^\n]*· (today|waiting)/);
});

test("a line with only the old today mark is not in Today, a due line is", () => {
  const root = brainWithTodos();
  writeFileSync(join(root, "projects/extra.md"), `---\ntype: Project\ntitle: Extra\ndescription: Extra.\n---\n\n# To-dos\n\n- [ ] Old mark only · today\n- [ ] Due today line · due ${now}\n- [ ] Overdue line · due ${yesterday}\n`);
  const texts = dayList(root).map((x) => x.text);
  assert.deepEqual(["Old mark only", "Due today line", "Overdue line"].filter((text) => texts.includes(text)), ["Due today line", "Overdue line"]);
});

test("undo refuses when the line changed since", () => {
  const root = brainWithTodos();
  done(root, "Advil");
  writeFileSync(join(root, "projects/visit.md"), file(root).replace("[x] Ask about Advil", "[x] Ask about Advil edited"));
  assert.throws(() => undo(root), /changed since/);
});

test("when words map to dates and tokens", () => {
  assert.deepEqual(parseWhen("today", "2026-11-05"), { due: "2026-11-05", label: "today" });
  assert.equal(parseWhen("fri", "2026-11-05").due, "2026-11-06"); // a Thursday
  assert.equal(parseWhen("thu", "2026-11-05").due, "2026-11-12");
  assert.deepEqual(parseWhen("someday"), { outcome: "someday", label: "someday" });
  assert.throws(() => parseWhen("soon"));
});

const help = (...args: string[]) => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "help", ...args], { encoding: "utf8", env: { ...process.env, BRAIN_HOME: makeBrain(), NO_COLOR: "1" } });

test("brain help names the commands that are left, and an old command fails with the help", () => {
  const r = help();
  assert.deepEqual(["index", "check", "serve", "pull", "migrate", "intake", "thread"].filter((name) => !r.stdout.includes(`brain ${name}`)), []);
  const old = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, "add", "a made-up thought"], { encoding: "utf8", env: { ...process.env, BRAIN_HOME: makeBrain(), NO_COLOR: "1" } });
  assert.equal(old.status, 1);
  assert.match(old.stderr + old.stdout, /Unknown command: add/);
});

// ---- R9: what happened, follow-up, why ----

import { doneWith, dropWith } from "../src/todos/wrapup.ts";
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
  assert.match(file(root), new RegExp(`- \\[ \\] Pick up the results · due ${now}\\n`));
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
  assert.deepEqual(lines.filter((line) => line.startsWith("- [x] Later thing")), [`- [x] Later thing · someday · done ${now}`]);
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

test("done and move accept a stable path::text ref, and fail clearly when it is gone", () => {
  const root = brainWithTodos();
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
