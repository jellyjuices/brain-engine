import { createServer, type Server } from "node:http";
import { writeFileSync } from "node:fs";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { TEST_CONFIG } from "./fixture.ts";

export const MODEL = "sample-model:7b";

export interface Seen {
  path: string;
  body: Record<string, any>;
}

export interface FakeHelper {
  url: string;
  seen: Seen[];
  replies: unknown[];
  close: () => void;
}

const reply = (content: string, finish = "stop") => ({ choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: finish }] });
export const good = (value: unknown) => reply(JSON.stringify(value));
export const REDIRECT = Symbol("redirect");
export const cut =(content: string) => reply(content, "length");

export async function fakeHelper(): Promise<FakeHelper> {
  const seen: Seen[] = [];
  const replies: unknown[] = [];
  const server: Server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    seen.push({ path: req.url ?? "", body: JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") });
    const body = req.url === "/v1/chat/completions" ? replies.shift() : { done: true };
    if (body === REDIRECT) return void res.writeHead(307, { Location: "http://192.0.2.10/v1/chat/completions" }).end();
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(body));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { url, seen, replies, close: () => server.close() };
}

export function setHelperLines(lines: Record<string, string>): void {
  writeFileSync(join(TEST_CONFIG, "env"), Object.entries(lines).map(([k, v]) => `${k}=${v}\n`).join(""));
}

export const helperOn = (url: string) => setHelperLines({ BRAIN_HELPER_URL: url, BRAIN_HELPER_MODEL: MODEL });
export const helperOff = () => setHelperLines({});
