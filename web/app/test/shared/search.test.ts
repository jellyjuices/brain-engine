import { describe, expect, it } from "vitest";
import golden from "@shared/search/golden.json";
import {
  answerCard,
  chunkNote,
  fold,
  fuse,
  rank,
  tokenize,
  type Entry,
} from "@shared/search/index.ts";

function chunkAll() {
  return golden.notes.flatMap((note) => chunkNote(note.path, note.text));
}

function keys(list: Entry[]) {
  return list.map((entry) => `${entry.id}:${entry.hash}`);
}

const entries = chunkAll();

function byText(text: string) {
  return entries.find((entry) => entry.embedText === text)!;
}

describe("shared search chunker", () => {
  it("chunks the golden notes to the golden entries", () => {
    expect(chunkAll()).toEqual(golden.entries);
  });

  it("gives the same ids and hashes on a second run", () => {
    expect(keys(chunkAll())).toEqual(keys(entries));
  });

  it("splits a long section into parts of 200 words or fewer", () => {
    const paragraph = Array.from({ length: 90 }, (_, i) => `word${i}`).join(" ");
    const text = `# Garden plan\n\n${Array.from({ length: 5 }, () => paragraph).join("\n\n")}\n`;
    const sections = chunkNote("projects/garden-plan.md", text).filter(
      (entry) => entry.kind === "section",
    );
    expect(sections.map((entry) => entry.embedText.split(/\s+/).length - 2)).toEqual([
      180, 180, 90,
    ]);
  });
});

describe("shared search ranker", () => {
  it("adds 1 / (60 + rank) across lists and skips a missing list", () => {
    expect(Object.fromEntries(fuse([["a", "b"], ["b", "c"], undefined]))).toEqual({
      a: 1 / 61,
      b: 1 / 62 + 1 / 61,
      c: 1 / 62,
    });
  });

  it("keeps a note whose name matches ahead of fused results", () => {
    const vitamins = byText("Refill the vitamins").id;
    const hits = rank("patty", entries, [[vitamins], [vitamins]]);
    expect(hits.map((hit) => hit.entry.subject)).toEqual(["people/pat-doe.md", "areas/health.md"]);
  });

  it("breaks ties by date, newest first", () => {
    const older = byText("Buy a gift for Pat").id;
    const newer = byText("Cita con el médico").id;
    expect(rank("gift cita", entries, [[older], [newer]]).map((hit) => hit.entry.id)).toEqual([
      newer,
      older,
    ]);
  });

  it("picks the top entry as the answer card", () => {
    const party = byText("Birthday party at the lake house");
    const hits = rank("when is the party", entries, [
      [party.id, byText("Send the party invite").id],
    ]);
    expect(answerCard(hits)).toEqual({
      id: party.id,
      text: "Birthday party at the lake house",
      date: "2026-03-14",
      path: "people/pat-doe.md",
      line: 12,
    });
  });
});

describe("shared search fold", () => {
  it.each([
    ["Médico CLÍNICA", "medico clinica"],
    ["Ｔｏｋｙｏ", "tokyo"],
  ])("folds %s to %s", (text, folded) => {
    expect(fold(text)).toBe(folded);
  });

  it("tokenizes a Spanish line without accents", () => {
    expect(tokenize("Cita con el Médico")).toEqual(["cita", "con", "el", "medico"]);
  });

  it.each(["歯医", "医者", "東京"])("yields %s from a Japanese run", (term) => {
    expect(tokenize("歯医者は東京駅")).toContain(term);
  });

  it("yields pairs without Intl.Segmenter", () => {
    expect(tokenize("東京へ 駅", null)).toEqual(["東京", "京へ", "駅"]);
  });
});
