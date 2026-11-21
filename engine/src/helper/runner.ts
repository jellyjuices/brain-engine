import { type HelperConfig, helperConfig } from "./config.ts";
import { fits, type Schema } from "./guard.ts";

export const REASONS = {
  off: "No helper is set up on your home server.",
  down: "The helper is not running on your home server.",
  slow: "The helper took too long to answer.",
  unreadable: "The helper's answer could not be read.",
  refused: "The helper could not answer.",
  stopped: "Stopped.",
} as const;

export type Reason = keyof typeof REASONS;

export class HelperError extends Error {
  readonly reason: Reason;

  constructor(reason: Reason) {
    super(REASONS[reason]);
    this.reason = reason;
  }
}

export interface Ask {
  kind: string;
  system: string;
  user: string;
  schema: Schema;
  maxTokens: number;
  temperature: number;
  signal?: AbortSignal;
}

const WARM_MS = 90_000;
const JOB_MS = 180_000;
const SUMMARY_MS = 30_000;
const UNLOAD_MS = 10_000;
const INTAKE_KEEP = "10m";
const JOB_KEEP = "5m";

let answering = true;

export function helperAnswering(): boolean {
  return answering;
}

function isSummary(kind: string): boolean {
  return kind === "intake_summary";
}

function failure(e: unknown, signal?: AbortSignal): HelperError {
  if (e instanceof HelperError) return e;
  if (signal?.aborted) return new HelperError("stopped");
  const name = (e as Error)?.name;
  if (name === "TimeoutError" || name === "AbortError") return new HelperError("slow");
  const code = ((e as Error)?.cause as { code?: unknown } | undefined)?.code;
  return new HelperError(typeof code === "string" ? "down" : "refused");
}

async function post(cfg: HelperConfig, path: string, body: object, ms: number, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(ms);
  try {
    const res = await fetch(`${cfg.url}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok) throw new HelperError("refused");
    const data: unknown = await res.json().catch(() => undefined);
    answering = true;
    return data;
  } catch (e) {
    const err = failure(e, signal);
    if (err.reason === "down" || err.reason === "slow") answering = false;
    throw err;
  }
}

function request(cfg: HelperConfig, a: Ask): object {
  return {
    model: cfg.model,
    messages: [
      { role: "system", content: a.system },
      { role: "user", content: a.user },
    ],
    max_tokens: a.maxTokens,
    temperature: a.temperature,
    stream: false,
    keep_alive: isSummary(a.kind) ? INTAKE_KEEP : JOB_KEEP,
    think: false,
    reasoning_effort: "none",
    response_format: { type: "json_schema", json_schema: { name: a.kind, strict: true, schema: a.schema } },
  };
}

interface Choice {
  finish_reason?: string;
  message?: { content?: unknown };
}

function readReply(reply: unknown, schema: Schema): { value: unknown } | undefined {
  const choice = (reply as { choices?: Choice[] } | undefined)?.choices?.[0];
  if (!choice || choice.finish_reason !== "stop") return undefined;
  const content = choice.message?.content;
  if (typeof content !== "string") return undefined;
  try {
    const value: unknown = JSON.parse(content);
    return fits(value, schema) ? { value } : undefined;
  } catch {
    return undefined;
  }
}

function config(): HelperConfig {
  const cfg = helperConfig();
  if (!cfg) throw new HelperError("off");
  return cfg;
}

export async function ask(a: Ask): Promise<unknown> {
  const cfg = config();
  const ms = isSummary(a.kind) ? SUMMARY_MS : JOB_MS;
  for (let attempt = 0; attempt < 2; attempt++) {
    const read = readReply(await post(cfg, "/v1/chat/completions", request(cfg, a), ms, a.signal), a.schema);
    if (read) return read.value;
  }
  throw new HelperError("unreadable");
}

export async function warm(): Promise<void> {
  const cfg = config();
  await post(cfg, "/api/generate", { model: cfg.model, prompt: "", keep_alive: INTAKE_KEEP }, WARM_MS).catch((e: HelperError) => {
    if (e.reason !== "refused") throw e;
  });
}

export async function unload(): Promise<void> {
  const cfg = helperConfig();
  if (!cfg) return;
  await post(cfg, "/api/generate", { model: cfg.model, prompt: "", keep_alive: 0 }, UNLOAD_MS).catch(() => undefined);
}
