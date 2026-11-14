// T9: 30 questions on a made-up brain. Fused search must beat words only, and find every typo, Spanish and Japanese one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { embedPending } from "../src/core/embed.ts";
import { find, findEntries, updateIndex, type FindResult } from "../src/core/search.ts";
import { NO_NAME } from "../shared/search/index.ts";
import { fakeEmbedder, questions, t9Brain, type Question } from "./t9-brain.ts";

const TOP = 5;

async function setup() {
  const root = t9Brain();
  updateIndex(root);
  await embedPending(root, fakeEmbedder);
  return root;
}

const found = (result: FindResult, q: Question) => {
  const top = result.notes.slice(0, TOP).map((hit) => hit.path);
  return q.want.every((path) => top.includes(path));
};

async function run(root: string, fused: boolean): Promise<Map<Question, boolean>> {
  const out = new Map<Question, boolean>();
  for (const q of questions()) {
    const result = fused ? await find(root, q.q, {}, fakeEmbedder) : findEntries(root, q.q, {}, { model: "none" });
    out.set(q, found(result, q));
  }
  return out;
}

function recall(results: Map<Question, boolean>, group?: Question["group"]): string {
  const picked = [...results].filter(([q]) => !group || q.group === group);
  return `${picked.filter(([, ok]) => ok).length}/${picked.length}`;
}

const missed = (results: Map<Question, boolean>, groups: Question["group"][]) =>
  [...results].filter(([q, ok]) => groups.includes(q.group) && !ok).map(([q]) => q.q);

test("T9: the question set has 30 questions in every group", () => {
  const all = questions();
  assert.equal(all.length, 30);
  for (const group of ["words", "typo", "part", "spanish", "japanese", "meaning"] as const) assert.ok(all.some((q) => q.group === group), group);
  assert.ok(all.some((q) => q.group === "japanese" && [...q.q].length === 2));
});

test("T9: fused recall at 5 beats words only; every typo, Spanish and Japanese question is found", async (t) => {
  const root = await setup();
  const words = await run(root, false);
  const fused = await run(root, true);
  for (const group of ["words", "typo", "part", "spanish", "japanese", "meaning"] as const) t.diagnostic(`${group}: words ${recall(words, group)}, fused ${recall(fused, group)}`);
  t.diagnostic(`all: words ${recall(words)}, fused ${recall(fused)}`);
  assert.deepEqual(missed(fused, ["typo", "spanish", "japanese"]), []);
  assert.deepEqual(missed(words, ["spanish", "japanese"]), []);
  const score = (results: Map<Question, boolean>) => [...results.values()].filter(Boolean).length;
  assert.ok(score(fused) > score(words), `fused ${recall(fused)} should beat words ${recall(words)}`);
});

test("T9: a typo ranks the close word above a word that only shares trigrams", async () => {
  const root = await setup();
  const result = await find(root, "dentst", {}, null);
  assert.equal(result.notes[0]?.path, "topics/health-log.md");
  const strings = findEntries(root, "dentst", {}, { model: "none" }).hits.map((hit) => hit.entry.subject);
  const at = (path: string) => (strings.includes(path) ? strings.indexOf(path) : Infinity);
  assert.ok(at("topics/health-log.md") < at("topics/identity.md"));
});

test("T9: the name tier stays on top with meaning in play", async () => {
  const root = await setup();
  const names: [string, string][] = [["Mira", "people/mira-okafor.md"], ["Mira Okafor", "people/mira-okafor.md"], ["Kenji Mori", "people/kenji-mori.md"], ["Tomas", "people/tomas-reyes.md"], ["Tomás Reyes", "people/tomas-reyes.md"], ["Ana", "people/ana-vidal.md"]];
  for (const [q, path] of names) {
    const result = await find(root, q, {}, fakeEmbedder);
    assert.equal(result.notes[0]?.path, path, q);
    assert.ok((result.hits[0]?.tier ?? NO_NAME) < NO_NAME, q);
  }
});
