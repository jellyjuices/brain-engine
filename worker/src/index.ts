import { hasValidSession, requireRelayToken, type Env } from "./auth.ts";
import { json, jsonError, withHeaders } from "./headers.ts";
import { calendarFeed } from "./calendar.ts";
import { proxyToMac } from "./proxy.ts";
import { ack, addToInbox, pending } from "./relay.ts";
import { lock, unlock, unlockStatus } from "./unlock.ts";

function methodNotAllowed() {
  return jsonError("Method not allowed", 405);
}

async function route(request: Request, env: Env): Promise<Response> {
  const { pathname } = new URL(request.url);
  const method = request.method;

  if (pathname.startsWith("/relay/")) {
    const denied = await requireRelayToken(env, request);
    if (denied) return denied;
    if (pathname === "/relay/pending") return method === "GET" ? pending(env) : methodNotAllowed();
    if (pathname === "/relay/ack")
      return method === "POST" ? ack(env, request) : methodNotAllowed();
    return jsonError("Not found", 404);
  }

  if (pathname.startsWith("/cal/")) return calendarFeed(request, env);

  if (!pathname.startsWith("/api/")) return jsonError("Not found", 404);

  if (pathname === "/api/health") return json({ ok: true });
  if (pathname === "/api/unlock") {
    if (method === "POST") return unlock(env, request);
    return method === "GET" ? unlockStatus(env, request) : methodNotAllowed();
  }

  if (!(await hasValidSession(env, request))) return jsonError("This brain is locked", 401);

  if (pathname === "/api/lock") return method === "POST" ? lock() : methodNotAllowed();
  if (pathname === "/api/inbox")
    return method === "POST" ? addToInbox(env, request) : methodNotAllowed();
  return proxyToMac(request, env);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await route(request, env);
    return withHeaders(response, new URL(request.url).pathname);
  },
};
