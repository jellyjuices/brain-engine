import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { answerCard, chunkNote, fold, fuse, rank, tokenize, type Entry } from "../shared/search/index.ts";

type Note = { path: string; text: string };
const golden: { notes: Note[]; entries: Entry[] } = JSON.parse(readFileSync(new URL("../shared/search/golden.json", import.meta.url), "utf8"));
const chunkAll = () => golden.notes.flatMap((note) => chunkNote(note.path, note.text));
const entries = chunkAll();
const byText = (text: string) => entries.find((entry) => entry.embedText === text)!;

test("golden notes chunk to the golden entries", () => {
  assert.deepEqual(chunkAll(), golden.entries);
});

test("a second run gives the same ids and hashes", () => {
  const keys = (list: Entry[]) => list.map((entry) => `${entry.id}:${entry.hash}`);
  assert.deepEqual(keys(chunkAll()), keys(entries));
});

test("ticking a to-do keeps its id and changes only its hash", () => {
  const note = golden.notes[0]!;
  const ticked = note.text.replace("- [ ] Buy a gift for Pat · due 2026-03-10", "- [x] Buy a gift for Pat · due 2026-03-10 · done 2026-03-09");
  const before = chunkNote(note.path, note.text);
  const after = chunkNote(note.path, ticked);
  const changed = after.filter((entry, i) => entry.hash !== before[i]!.hash).map((entry) => entry.embedText);
  assert.deepEqual(after.map((entry) => entry.id), before.map((entry) => entry.id));
  assert.deepEqual(changed, ["Buy a gift for Pat"]);
});

test("a long section splits into parts of 200 words or fewer", () => {
  const paragraph = Array.from({ length: 90 }, (_, i) => `word${i}`).join(" ");
  const text = `# Garden plan\n\n${[paragraph, paragraph, paragraph, paragraph, paragraph].join("\n\n")}\n`;
  const sections = chunkNote("projects/garden-plan.md", text).filter((entry) => entry.kind === "section");
  assert.deepEqual(sections.map((entry) => entry.embedText.split(/\s+/).length - 2), [180, 180, 90]);
});

test("fusion adds 1 / (60 + rank) across lists and skips a missing list", () => {
  const scores = fuse([["a", "b"], ["b", "c"], undefined]);
  assert.deepEqual(Object.fromEntries(scores), { a: 1 / 61, b: 1 / 62 + 1 / 61, c: 1 / 62 });
});

test("a note whose name matches stays ahead of fused results", () => {
  const vitamins = byText("Refill the vitamins").id;
  const hits = rank("patty", entries, [[vitamins], [vitamins]]);
  assert.deepEqual(hits.map((hit) => hit.entry.subject), ["people/pat-doe.md", "areas/health.md"]);
});

test("ties break by date, newest first", () => {
  const older = byText("Buy a gift for Pat").id;
  const newer = byText("Cita con el médico").id;
  const hits = rank("gift cita", entries, [[older], [newer]]);
  assert.deepEqual(hits.map((hit) => hit.entry.id), [newer, older]);
});

test("the answer card is the top entry with its line, date and note path", () => {
  const party = byText("Birthday party at the lake house");
  const hits = rank("when is the party", entries, [[party.id, byText("Send the party invite").id]]);
  assert.deepEqual(answerCard(hits), { id: party.id, text: "Birthday party at the lake house", date: "2026-03-14", path: "people/pat-doe.md", line: 12 });
});

test("fold drops case and accents", () => {
  assert.equal(fold("Médico CLÍNICA"), "medico clinica");
});

test("a Spanish line tokenizes without accents", () => {
  assert.deepEqual(tokenize("Cita con el Médico"), ["cita", "con", "el", "medico"]);
});

test("Japanese runs yield words plus character pairs", () => {
  assert.deepEqual(["歯医", "医者", "東京"].filter((term) => tokenize("歯医者は東京駅").includes(term)), ["歯医", "医者", "東京"]);
});

test("without Intl.Segmenter, Japanese runs still yield pairs", () => {
  assert.deepEqual(tokenize("東京へ 駅", null), ["東京", "京へ", "駅"]);
});
