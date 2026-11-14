import { safeEqual, type Env } from "./auth.ts";
import { jsonError } from "./headers.ts";

const TIMEOUT_MS = 8000;
const FEED_PATH = /^\/cal\/([A-Za-z0-9_-]{32,})\.ics$/;
const MIN_TOKEN_LENGTH = 32;

function notFound() {
  return jsonError("Not found", 404);
}

export async function calendarFeed(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return jsonError("Method not allowed", 405);
  const match = FEED_PATH.exec(new URL(request.url).pathname);
  const token = env.CAL_TOKEN ?? "";
  if (!match || token.length < MIN_TOKEN_LENGTH || !(await safeEqual(match[1]!, token))) return notFound();
  if (!env.MAC_ORIGIN || !env.SERVER_TOKEN) return jsonError("The Mac is offline", 503);
  try {
    const res = await fetch(`${env.MAC_ORIGIN.replace(/\/+$/, "")}/api/cal.ics`, {
      headers: { Accept: "text/calendar", Authorization: `Bearer ${env.SERVER_TOKEN}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return jsonError("The Mac is offline", 503);
    return new Response(request.method === "HEAD" ? null : await res.text(), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "private, max-age=900",
      },
    });
  } catch {
    return jsonError("The Mac is offline", 503);
  }
}
