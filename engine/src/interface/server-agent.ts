import { randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { Caller } from "./api-types.ts";
import { isAuthorized, isLocalApp } from "./server-auth.ts";

export const AGENT_RATE = 120;
const WINDOW_MS = 60_000;

export function agentTokenPath(): string {
  return process.env.BRAIN_AGENT_TOKEN_FILE || join(homedir(), ".config", "brain", "agent-token");
}

export function readAgentToken(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return readFileSync(path, "utf8").split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#"));
}

export function issueAgentToken(path: string): string {
  const token = randomBytes(32).toString("base64url");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, token + "\n", { mode: 0o600 });
  chmodSync(path, 0o600);
  return token;
}

export function revokeAgentToken(path: string): boolean {
  if (!existsSync(path)) return false;
  unlinkSync(path);
  return true;
}

export function callerOf(req: IncomingMessage, token: string, agentFile: string): Caller | undefined {
  if (isAuthorized(req, token) || isLocalApp(req, token)) return "owner";
  const agent = readAgentToken(agentFile);
  return agent && isAuthorized(req, agent) ? "agent" : undefined;
}

export class RateLimit {
  private readonly limit: number;
  private start = 0;
  private count = 0;
  constructor(limit: number) {
    this.limit = limit;
  }
  take(now = Date.now()): number {
    if (now - this.start >= WINDOW_MS) {
      this.start = now;
      this.count = 0;
    }
    if (this.count >= this.limit) return Math.ceil((this.start + WINDOW_MS - now) / 1000);
    this.count += 1;
    return 0;
  }
}
