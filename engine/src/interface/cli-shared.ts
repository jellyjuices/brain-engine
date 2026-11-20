import { join } from "node:path";
import { parseArgs } from "node:util";
import pc from "picocolors";
import { DIRS, type Summary } from "../core/notes.ts";
import { writeAtomic } from "../core/files.ts";
import type { Hit } from "../core/search.ts";

export interface CliContext {
  root: string;
  cmd: string;
  args: string[];
  flags: CliFlags;
  interactive: boolean;
  tag?: string;
  limit?: number;
  json: (value: unknown) => void;
  report: (data: unknown, text: string) => void;
}

export type CliFlags = ReturnType<typeof parseCli>["values"];

export const out = (s = "") => process.stdout.write(s + "\n");

export function parseCli(rest: string[]) {
  return parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      json: { type: "boolean" },
      type: { type: "string" },
      tag: { type: "string", multiple: true },
      area: { type: "string" },
      status: { type: "string" },
      limit: { type: "string" },
      full: { type: "boolean" },
      auto: { type: "boolean" },
      foreground: { type: "boolean" },
      "dry-run": { type: "boolean" },
      write: { type: "boolean" },
      single: { type: "boolean" },
      into: { type: "string" },
      bits: { type: "string" },
      journal: { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      all: { type: "boolean" },
      description: { type: "string", short: "d" },
      open: { type: "boolean" },
      lens: { type: "string" },
      from: { type: "string" },
      depth: { type: "string" },
      privacy: { type: "string" },
      star: { type: "boolean" },
      unstar: { type: "boolean" },
      session: { type: "string" },
      quote: { type: "string" },
      date: { type: "string" },
      with: { type: "string" },
      raw: { type: "string" },
      question: { type: "string" },
      role: { type: "string" },
      about: { type: "string" },
      fact: { type: "string", multiple: true },
      when: { type: "string" },
      port: { type: "string" },
      host: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
}

export const restText = (args: string[]) => args.slice(1).join(" ").trim();

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function fail(msg: string): number {
  process.stderr.write(pc.red(msg) + "\n");
  return 1;
}
