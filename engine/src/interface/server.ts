import { createServer as httpServer, type IncomingMessage, type Server } from "node:http";
import { health } from "./server-reads.ts";
import { readBody } from "./server-context.ts";
import { send } from "./server-send.ts";
import { DEFAULT_PORT, HttpError, loadToken, serveApp, tokenPath } from "./server-auth.ts";
import { AGENT_RATE, agentTokenPath, callerOf, RateLimit } from "./server-agent.ts";
import { snapshot, withCheck, withUndoId } from "./server-check.ts";
import { logMark } from "../core/log.ts";
import { matchRoute } from "./routes/table.ts";
import { handleMcp, isMcp } from "./mcp/http.ts";

export interface ServerOptions {
  agentTokenFile?: string;
  agentRate?: number;
}

const WRITES = new Set(["POST", "PUT", "DELETE"]);

function authorize(req: IncomingMessage, token: string, agentFile: string, limit: RateLimit) {
  const caller = callerOf(req, token, agentFile);
  if (!caller) throw new HttpError(401, "A token is needed.");
  const wait = caller === "agent" ? limit.take() : 0;
  if (wait) throw new HttpError(429, "Too many calls. Wait a little and try again.", { retry_after: wait });
  return caller;
}

const hasBody = (method: string) => method === "POST" || method === "PUT";

async function handle(root: string, token: string, req: IncomingMessage, agentFile: string, limit: RateLimit): Promise<unknown> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) throw new HttpError(404, "Not found.");
  if (url.pathname === "/api/health") return health(root);
  const caller = authorize(req, token, agentFile, limit);
  const method = req.method ?? "GET";
  const { route, rest } = matchRoute(method, url.pathname);
  if (route.owner && caller !== "owner") throw new HttpError(403, "Only the owner can do that.");
  const body = hasBody(method) ? await readBody(req) : {};
  const before = WRITES.has(method) ? snapshot(root) : undefined;
  const mark = logMark(root);
  const result = await route.handler({ root, url, body, caller, agentFile }, rest);
  return before ? withUndoId(root, mark, withCheck(root, before, result)) : result;
}

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
