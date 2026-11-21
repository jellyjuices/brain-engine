import type { Env } from "./auth.ts";
import { json } from "./headers.ts";

const TIMEOUT_MS = 8000;
const TUNNEL_DOWN = new Set([502, 503, 504, 530]);

function offline() {
  return json({ error: "Your home server is offline", offline: true }, 503);
}

function forwardHeaders(request: Request, env: Env): Headers {
  const headers = new Headers();
  const type = request.headers.get("Content-Type");
  if (type) headers.set("Content-Type", type);
  headers.set("Accept", request.headers.get("Accept") ?? "application/json");
  headers.set("Authorization", `Bearer ${env.SERVER_TOKEN}`);
  return headers;
}

export async function proxyToMac(request: Request, env: Env): Promise<Response> {
  if (!env.MAC_ORIGIN || !env.SERVER_TOKEN) return offline();
  const { pathname, search } = new URL(request.url);
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const res = await fetch(`${env.MAC_ORIGIN.replace(/\/+$/, "")}${pathname}${search}`, {
      method: request.method,
      headers: forwardHeaders(request, env),
      body: hasBody ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (TUNNEL_DOWN.has(res.status)) return offline();
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
    });
  } catch {
    return offline();
  }
}
