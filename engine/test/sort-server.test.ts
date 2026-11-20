import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeBrain } from "./fixture.ts";
import { loadAll } from "../src/core/files.ts";
import { guessFor } from "../src/sort/guess.ts";
import { saveSorted } from "../src/capture/pull.ts";

const CYCLING = "---\ntype: Topic\ntitle: Cycling\ndescription: The road bike and rides.\n---\n\n# Notes\n\n- 2026-10-02 · The chain skips on the big cog\n- 2026-10-09 · New tyre levers live in the saddle bag\n- 2026-10-20 · Pump the tyre to 80 psi before a long ride\n";
const COOKING = "---\ntype: Topic\ntitle: Cooking\ndescription: Food at home.\n---\n\n# Notes\n\n- 2026-10-03 · Soak the beans overnight\n- 2026-10-11 · The good knife needs a sharpen\n";

function brainWithTopics(): string {
  const root = makeBrain();
  writeFileSync(join(root, "topics/cycling.md"), CYCLING);
  writeFileSync(join(root, "topics/cooking.md"), COOKING);
  return root;
}

test("guessFor sends an unnamed line to the subject whose lines share its words", async () => {
  const root = brainWithTopics();
  const guess = await guessFor(root, loadAll(root), "pump the tyre and oil the chain");
  assert.deepEqual({ into: guess.into, how: guess.how }, { into: "topics/cycling.md", how: "near" });
});

test("guessFor has no guess for words no subject holds", async () => {
  const root = brainWithTopics();
  const guess = await guessFor(root, loadAll(root), "renew the passport");
  assert.deepEqual(guess, { into: null, how: "none", sure: false, people: [], re: [] });
});

test("saveSorted files an unnamed to-do on its nearest subject", async () => {
  const root = brainWithTopics();
  const result = await saveSorted(root, { client_id: "c9b1e7a2-4f1d-4c55-9a0e-2b7d1f3c8e10", text: "tomorrow: pump the tyre and oil the chain", kind: "todo" });
  assert.deepEqual({ saved: result.saved, path: result.path }, { saved: "filed", path: "topics/cycling.md" });
  assert.match(readFileSync(join(root, "topics/cycling.md"), "utf8"), /^- \[ \] pump the tyre and oil the chain/m);
});
