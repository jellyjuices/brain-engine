import {
  clearFailures,
  clearSessionCookie,
  clientKey,
  createSessionCookie,
  hasValidSession,
  isPasswordOff,
  isSessionConfigured,
  recordFailure,
  retryAfterSeconds,
  safeEqual,
  type Env,
} from "./auth.ts";
import { json, jsonError } from "./headers.ts";

export async function unlockStatus(env: Env, request: Request): Promise<Response> {
  if (isPasswordOff(env, request)) return json({ unlocked: true, noPassword: true });
  return json({ unlocked: await hasValidSession(env, request) });
}

export async function unlock(env: Env, request: Request): Promise<Response> {
  if (!isSessionConfigured(env))
    return jsonError("The app password is not configured: set PASSWORD and SESSION_SECRET", 503);
  const key = clientKey(request);
  const wait = await retryAfterSeconds(env, key);
  if (wait > 0)
    return jsonError("Too many attempts. Try again later", 429, { "Retry-After": String(wait) });

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  if (typeof body.password !== "string" || !(await safeEqual(body.password, env.PASSWORD))) {
    await recordFailure(env, key);
    return jsonError("That password is not right", 401);
  }
  await clearFailures(env, key);
  return json({ unlocked: true }, 200, { "Set-Cookie": await createSessionCookie(env) });
}

export function lock(): Response {
  return json({ unlocked: false }, 200, { "Set-Cookie": clearSessionCookie() });
}
