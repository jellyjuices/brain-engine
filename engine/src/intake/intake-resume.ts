import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { STAGES } from "./lenses.ts";

export interface LastQuestion {
  text: string;
  lens?: string;
}

const RAW_DIR = "sources/intake";
const STAGES_FILE = ".claude/skills/intake/stages.md";
const MODULES: Record<number, string[]> = { 5: ["Modern life"], 7: ["Body"], 9: ["Identity", "LGBTQ+"] };
const LAST = STAGES.length - 1;

export function lastQuestion(root: string): LastQuestion | undefined {
  const dir = join(root, RAW_DIR);
  if (!existsSync(dir)) return undefined;
  const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  for (const file of files.reverse()) {
    const found = lastIn(readFileSync(join(dir, file), "utf8"));
    if (found) return found;
  }
  return undefined;
}

function lastIn(text: string): LastQuestion | undefined {
  const blocks = text.split(/^## /m).slice(1).reverse();
  for (const block of blocks) {
    const q = block.match(/^\*\*Q:\*\* (.+)$/m)?.[1].trim();
    if (q) return { text: q, lens: block.split("\n")[0].split("·")[1]?.trim() };
  }
  return undefined;
}

export function validStages(): string {
  return `Use a stage number from 0 to ${LAST}.`;
}

export function stageText(root: string, n: number): string {
  const file = join(root, STAGES_FILE);
  if (!existsSync(file)) throw new Error(`No stages file at ${STAGES_FILE} in the brain.`);
  const lines = readFileSync(file, "utf8").split("\n");
  const row = lines.find((l) => l.startsWith(`| ${n} |`));
  if (!row) throw new Error(`Stage ${n} is not in ${STAGES_FILE}. ${validStages()}`);
  const modules = (MODULES[n] ?? []).flatMap((name) => lines.filter((l) => l.startsWith(`- **${name}`)));
  return [row, ...modules].join("\n");
}
