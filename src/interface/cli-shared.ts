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

export function printHits(hits: (Hit | Summary)[]) {
  if (!hits.length) return out(pc.dim("No matches."));
  for (const hit of hits) {
    const meta = [hit.type, hit.area, hit.tags.join(" ")].filter(Boolean).join(" · ");
    out(`${pc.bold(hit.title)}  ${pc.dim(hit.path)}`);
    if (hit.description) out(`  ${hit.description}`);
    if ("snippet" in hit && hit.snippet) out(`  ${hit.snippet.replace(/\[([^\]]*)\]/g, (_, w: string) => pc.yellow(w))}`);
    if (meta) out(`  ${pc.cyan(meta)}`);
  }
}

export function writeReport(root: string, name: string, md: string) {
  const path = join(root, DIRS.reports, `${name}.md`);
  writeAtomic(path, md + "\n");
  return path;
}

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
      foreground: { type: "boolean" },
      "dry-run": { type: "boolean" },
      single: { type: "boolean" },
      into: { type: "string" },
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

export function fail(msg: string): number {
  process.stderr.write(pc.red(msg) + "\n");
  return 1;
}
