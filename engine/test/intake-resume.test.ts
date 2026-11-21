import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { saveLensAnswer } from "../src/intake/lens-answers.ts";
import { addThread } from "../src/intake/threads.ts";
import { intakeStatus } from "../src/intake/intake-status.ts";
import { BIN, makeBrain, STARTER } from "./fixture.ts";

function fixture(): string {
  const root = makeBrain();
  mkdirSync(join(root, "me"), { recursive: true });
  writeFileSync(join(root, "me", "settings.yaml"), 'called: ""\npronouns: ""\nown_words: []\nstop_word: pause\nstages_done: {}\n');
  const skill = ".claude/skills/intake";
  mkdirSync(join(root, skill), { recursive: true });
  cpSync(join(STARTER, skill, "stages.md"), join(root, skill, "stages.md"));
  return root;
}

const run = (root: string, ...args: string[]) =>
  spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", BIN, ...args], { env: { ...process.env, BRAIN_HOME: root }, encoding: "utf8" });

test("status gives the current stage, open thread count and last question", () => {
  const root = fixture();
  saveLensAnswer(root, "day", "Woke up at 7.", { raw: "I woke up at seven.", question: "Walk me through yesterday." });
  addThread(root, { question: "What would a lighter week look like?", lens: "day" });
  const s = JSON.parse(run(root, "intake", "status", "--json").stdout);
  assert.deepEqual(s.current, { n: 0, name: "Set up" });
  assert.equal(s.openThreads, 1);
  assert.deepEqual(s.lastQuestion, { text: "Walk me through yesterday.", lens: "day" });
  assert.ok(s.stages && s.threads && s.openLoops);
  assert.equal(intakeStatus(makeBrain()).lastQuestion, undefined);
});

test("stage <n> prints only that row and its module", () => {
  const root = fixture();
  const r = run(root, "intake", "stage", "9");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^\| 9 \| identity/m);
  assert.match(r.stdout, /- \*\*Identity\./);
  assert.doesNotMatch(r.stdout, /\| 8 \|/);
  assert.doesNotMatch(r.stdout, /\| 10 \|/);
  assert.doesNotMatch(r.stdout, /Body\./);
  const plain = run(root, "intake", "stage", "3");
  assert.equal(plain.stdout.trim().split("\n").length, 1);
});

for (const bad of ["99", "x", "2.5"]) {
  test(`stage ${bad} errors with the valid range`, () => {
    const r = run(fixture(), "intake", "stage", bad);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /0 to 11/);
  });
}

test("stage with no n errors with the valid range", () => {
  const r = run(fixture(), "intake", "stage");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /0 to 11/);
});

test("thread list caps at 10 and says how many more; --all shows all", () => {
  const root = fixture();
  for (let i = 1; i <= 17; i++) addThread(root, { question: `Question number ${String(i).padStart(2, "0")}`, lens: "day" });
  const lines = (r: string) => r.trim().split("\n");
  const capped = lines(run(root, "thread", "list").stdout);
  assert.equal(capped.length, 11);
  assert.match(capped[10], /and 7 more/);
  const all = lines(run(root, "thread", "list", "--all").stdout);
  assert.equal(all.length, 17);
  assert.doesNotMatch(all.join("\n"), /more/);
});
