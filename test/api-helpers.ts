// Shared setup for the API contract tests: a temp brain, a test owner token and a temp agent token file.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { once } from "node:events";
import { addDays, today } from "../src/core/notes.ts";
import { createServer, type ServerOptions } from "../src/interface/server.ts";
import { makeBrain } from "./fixture.ts";

export const TOKEN = "owner-test-token";
export const now = today();

export function apiBrain(): string {
  const root = makeBrain();
  writeFileSync(join(root, "people/dana-cole.md"), "---\ntype: Person\ntitle: Dana Cole\ndescription: A made-up neighbour.\n---\n\n# To-dos\n\n# Notes\n");
  writeFileSync(join(root, "projects/garden-shed.md"), `---\ntype: Project\ntitle: Garden shed\ndescription: Build a small shed.\n---\n\n# To-dos\n\n- [ ] Buy cedar boards · due ${now}\n- [ ] Pick a roof colour\n- [ ] Ask about the permit · waiting\n- [ ] Pour the base · due ${addDays(now, 3)}\n\n# Notes\n`);
  return root;
}

export interface Api {
  call: (method: string, path: string, body?: unknown, auth?: string | null) => Promise<{ status: number; data: any; headers: Headers }>;
  close: () => void;
  root: string;
  agentFile: string;
}

export async function startApi(opts: ServerOptions = {}, root = apiBrain()): Promise<Api> {
  const agentFile = join(mkdtempSync(join(tmpdir(), "brain-agent-")), "agent-token");
  const server = createServer(root, TOKEN, { agentTokenFile: agentFile, ...opts });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call: Api["call"] = async (method, path, body, auth = TOKEN) => {
    const res = await fetch(base + path, { method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: res.status, data: await res.json(), headers: res.headers };
  };
  return { call, close: () => server.close(), root, agentFile };
}

export async function withApi(fn: (api: Api) => Promise<void>, opts: ServerOptions = {}): Promise<void> {
  const api = await startApi(opts);
  try {
    await fn(api);
  } finally {
    api.close();
  }
}
