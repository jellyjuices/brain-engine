import { spawnSync } from "node:child_process";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { ask, BACK } from "./menu.ts";
import { updateIndex } from "../core/search.ts";
import { clip, type Opt } from "./ui-view.ts";

export const width = () => process.stdout.columns || 80;

export async function pick(message: string, options: Opt[], opts: { initialValue?: string; signal?: AbortSignal } = {}): Promise<string | typeof BACK> {
  return ask(p.select<string>({ message: clip(message, width() - 4), options: options as { value: string; label: string; disabled?: boolean }[], maxItems: 14, ...opts }));
}

export function openInEditor(root: string, path: string) {
  const editor = process.env.EDITOR?.trim() || "open";
  const proc = spawnSync(`${editor} ${JSON.stringify(join(root, path))}`, { shell: true, stdio: "inherit" });
  if (proc.status) p.log.warn(`Could not open it with ${editor}.`);
}

/** Housekeeping: keep the search index current. Quiet. */
export function tidy(root: string) {
  try { updateIndex(root); } catch { /* the next search rebuilds it */ }
}

/** Run a write, show its one line, keep the index current. Errors show as a message, not a crash. */
export async function run<T extends { line: string }>(root: string, fn: () => T | Promise<T>): Promise<T | undefined> {
  try {
    const result = await fn();
    p.log.success(result.line.replace(/ · brain undo.*$/, " · u to undo"));
    tidy(root);
    return result;
  } catch (err) {
    p.log.error((err as Error).message);
    return undefined;
  }
}

/** One to-do: Done, Tomorrow, Pick a day, Someday, Delete, Open <subject>. True when something changed. */
