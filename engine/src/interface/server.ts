// `brain serve`: the one way in for the app, the menu bar and helpers. JSON over node:http on loopback only.
//
// Every /api/ route except /api/health needs `Authorization: Bearer <token>`. The Worker sends the owner token; the
// phone never holds it. Helpers send the agent token (server-agent.ts). Writes call the same functions as the
// `brain` command, so they log to .log.jsonl and undo can reverse them. Every write re-indexes and checks the notes
// it changed (server-check.ts). The routes and their shapes: routes/table.ts and api-types.ts.

import { createServer as httpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { health } from "./server-reads.ts";
import { readBody, TextBody } from "./server-context.ts";
import { DEFAULT_PORT, HttpError, loadToken, serveApp, tokenPath } from "./server-auth.ts";
import { AGENT_RATE, agentTokenPath, callerOf, RateLimit } from "./server-agent.ts";
import { snapshot, withCheck } from "./server-check.ts";
import { matchRoute } from "./routes/table.ts";
import { handleMcp, isMcp } from "./mcp/http.ts";

export interface ServerOptions {
  agentTokenFile?: string;
  agentRate?: number;
}

export function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const isText = body instanceof TextBody;
  const data = isText ? body.text : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": isText ? body.type : "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(data), ...headers });
  res.end(data);
}

const WRITES = new Set(["POST", "PUT", "DELETE"]);

async function handle(root: string, token: string, req: IncomingMessage, agentFile: string, limit: RateLimit): Promise<unknown> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) throw new HttpError(404, "Not found.");
  if (url.pathname === "/api/health") return health(root);
  const caller = callerOf(req, token, agentFile);
  if (!caller) throw new HttpError(401, "A token is needed.");
  if (caller === "agent") {
    const wait = limit.take();
    if (wait) throw new HttpError(429, "Too many calls. Wait a little and try again.", { retry_after: wait });
  }
  const method = req.method ?? "GET";
  const { route, rest } = matchRoute(method, url.pathname);
  if (route.owner && caller !== "owner") throw new HttpError(403, "Only the owner can do that.");
  const isWrite = WRITES.has(method);
  const body = method === "POST" || method === "PUT" ? await readBody(req) : {};
  const before = isWrite ? snapshot(root) : undefined;
  const result = await route.handler({ root, url, body, caller, agentFile }, rest);
  return before ? withCheck(root, before, result) : result;
}

/** The server, not yet listening. Tests call this with a temp brain, a test token and a temp agent token file. */
export function createServer(root: string, token: string, opts: ServerOptions = {}): Server {
  const agentFile = opts.agentTokenFile ?? agentTokenPath();
  const limit = new RateLimit(opts.agentRate ?? AGENT_RATE);
  return httpServer((req, res) => {
    if (isMcp(req.url)) return void handleMcp(req, res, { root, agentFile, limit }).catch(() => send(res, 500, { error: "Something went wrong." }));
    if (!(req.url ?? "/").startsWith("/api/")) {
      try {
        return serveApp(req, res, token);
      } catch (e) {
        return send(res, 400, { error: (e as Error).message || "Bad request." });
      }
    }
    handle(root, token, req, agentFile, limit).then(
      (body) => send(res, 200, body),
      (e: unknown) => {
        if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.extra }, e.status === 429 ? { "Retry-After": String(e.extra.retry_after) } : {});
        send(res, 500, { error: (e as Error).message || "Something went wrong." });
      },
    );
  });
}

const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1"]);

export function checkHost(host: string): void {
  if (!LOOPBACK.has(host)) throw new Error(`brain serve only listens on this Mac (127.0.0.1). It will not bind ${host}. Use the tunnel to reach it.`);
}

/** Start listening and stay up until the process is stopped. */
export function serve(root: string, opts: { host?: string; port?: number } = {}, say: (s: string) => void = console.log): Promise<number> {
  const host = opts.host ?? "127.0.0.1";
  const port = opts.port ?? DEFAULT_PORT;
  checkHost(host);
  const server = createServer(root, loadToken(tokenPath(), say));
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => say(`brain serve is listening on http://${host}:${port}`));
    server.once("close", () => resolve(0));
    for (const sig of ["SIGINT", "SIGTERM"] as const) process.once(sig, () => server.close());
  });
}
