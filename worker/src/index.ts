import { hasValidSession, requireRelayToken, type Env } from "./auth.ts";
import { json, jsonError, withHeaders } from "./headers.ts";
import { calendarFeed } from "./calendar.ts";
import { proxyToMac } from "./proxy.ts";
import { ack, addToInbox, pending } from "./relay.ts";
import { lock, unlock, unlockStatus } from "./unlock.ts";

function methodNotAllowed() {
  return jsonError("Method not allowed", 405);
}

type Handler = (request: Request, env: Env) => Response | Promise<Response>;
type Methods = Record<string, Handler>;

const RELAY: Record<string, Methods> = {
  "/relay/pending": { GET: (_request, env) => pending(env) },
  "/relay/ack": { POST: (request, env) => ack(env, request) },
};

const OPEN_API: Record<string, Methods> = {
  "/api/unlock": {
    POST: (request, env) => unlock(env, request),
    GET: (request, env) => unlockStatus(env, request),
  },
};

const LOCKED_API: Record<string, Methods> = {
  "/api/lock": { POST: () => lock() },
  "/api/inbox": { POST: (request, env) => addToInbox(env, request) },
};

function byMethod(methods: Methods, request: Request, env: Env): Response | Promise<Response> {
  const handler = Object.hasOwn(methods, request.method) ? methods[request.method] : undefined;
  return handler ? handler(request, env) : methodNotAllowed();
}

async function relay(request: Request, env: Env, pathname: string): Promise<Response> {
  const denied = await requireRelayToken(env, request);
  if (denied) return denied;
  const methods = RELAY[pathname];
  return methods ? byMethod(methods, request, env) : jsonError("Not found", 404);
}

async function api(request: Request, env: Env, pathname: string): Promise<Response> {
  if (pathname === "/api/health") return json({ ok: true });
  const open = OPEN_API[pathname];
  if (open) return byMethod(open, request, env);
  if (!(await hasValidSession(env, request))) return jsonError("This brain is locked", 401);
  const locked = LOCKED_API[pathname];
  return locked ? byMethod(locked, request, env) : proxyToMac(request, env);
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/relay/")) return relay(request, env, pathname);
  if (pathname.startsWith("/cal/")) return calendarFeed(request, env);
  return pathname.startsWith("/api/") ? api(request, env, pathname) : jsonError("Not found", 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await route(request, env);
    return withHeaders(response, new URL(request.url).pathname);
  },
};
