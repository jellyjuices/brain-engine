import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LOG_FILE, nowStamp } from "./notes.ts";

/** What `brain undo` needs to reverse one file change: at line `line`, `added` replaced `removed`. */
export interface UndoStep {
  path: string;
  line: number;
  removed: string[];
  added: string[];
}

export interface LogEntry {
  at: string;
  msg: string;
  /** Set on changes that `brain undo` can reverse. */
  id?: string;
  undo?: UndoStep[];
  /** Set on an undo entry: the id of the change it reversed. */
  undoes?: string;
}

/** Add one line to .log.jsonl. Append only: cheap, and easy for scripts and agents to read. */
export function log(root: string, message: string, extra: Omit<LogEntry, "at" | "msg"> = {}): void {
  appendFileSync(join(root, LOG_FILE), JSON.stringify({ at: nowStamp(), msg: message, ...extra } satisfies LogEntry) + "\n", "utf8");
}

/** The last n log entries, newest first. */
export function readLog(root: string, n = Infinity): LogEntry[] {
  const path = join(root, LOG_FILE);
  if (!existsSync(path)) return [];
  const out: LogEntry[] = [];
  for (const line of readFileSync(path, "utf8").split("\n").filter(Boolean)) {
    try {
      out.push(JSON.parse(line) as LogEntry);
    } catch {}
  }
  return out.slice(-n).reverse();
}
