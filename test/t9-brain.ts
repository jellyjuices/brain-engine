// T9 setup: a made-up brain, its 30 questions and a fake embedder with hand-made concept vectors.
import { mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Embedder } from "../src/core/embed.ts";
import { makeBrain, REPO } from "./fixture.ts";

export interface Question {
  group: "words" | "typo" | "part" | "spanish" | "japanese" | "meaning";
  q: string;
  want: string[];
}

const DIR = join(REPO, "test", "fixtures", "t9");

const CONCEPTS: string[][] = [
  ["dentist", "cleaning", "molar", "tooth", "teeth"],
  ["car", "oil", "garage", "tires", "hatchback", "automobile"],
  ["rent", "invoice", "budget", "salary", "money"],
  ["dog", "pet", "walks", "puppy", "vet"],
];

const SLOT = new Map(CONCEPTS.flatMap((words, slot) => words.map((word) => [word, slot] as const)));

export const fakeEmbedder: Embedder = {
  model: "t9-fake",
  async embed(texts) {
    return texts.map((text) => {
      const vector = new Array<number>(CONCEPTS.length).fill(0);
      for (const word of text.toLowerCase().match(/[a-z]+/g) ?? []) {
        const slot = SLOT.get(word);
        if (slot !== undefined) vector[slot] = (vector[slot] ?? 0) + 1;
      }
      return vector;
    });
  },
};

export const questions = (): Question[] => JSON.parse(readFileSync(join(DIR, "questions.json"), "utf8")) as Question[];

export function t9Brain(): string {
  const root = makeBrain();
  const notes = JSON.parse(readFileSync(join(DIR, "notes.json"), "utf8")) as Record<string, string[]>;
  const stamp = Date.now() / 1000 + 10;
  for (const [path, lines] of Object.entries(notes)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, `---\n${lines.join("\n")}\n`);
    utimesSync(full, stamp, stamp);
  }
  return root;
}
