import { jsonError } from "./headers.ts";

export interface Env {
  DB: D1Database;
  PASSWORD: string;
  SESSION_SECRET: string;
  RELAY_TOKEN: string;
  SERVER_TOKEN: string;
  MAC_ORIGIN: string;
  NO_PASSWORD?: string;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isPasswordOff(env: Env, request: Request): boolean {
  return env.NO_PASSWORD === "1" && LOOPBACK.has(new URL(request.url).hostname);
}

export const SESSION_COOKIE = "brain_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const WINDOW_SECONDS = 15 * 60;
export const MAX_FAILURES = 5;

const encoder = new TextEncoder();

function toBase64Url(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(text: string): Promise<string> {
  return toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

function isSameString(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

export async function safeEqual(a: string, b: string): Promise<boolean> {
  return isSameString(await sha256(a), await sha256(b));
}

export function isSessionConfigured(env: Env): boolean {
  return Boolean(env.PASSWORD) && Boolean(env.SESSION_SECRET);
}

async function sign(env: Env, stamp: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = `${stamp}.${await sha256(env.PASSWORD)}`;
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

export async function createSessionCookie(
  env: Env,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const expiresAt = nowSeconds + MAX_AGE_SECONDS;
  const token = `${expiresAt}.${await sign(env, String(expiresAt))}`;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return undefined;
}

export async function isValidSessionToken(
  env: Env,
  token: string | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  if (!isSessionConfigured(env) || !token) return false;
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;
  const stamp = token.slice(0, separator);
  const expiresAt = Number(stamp);
  if (!Number.isFinite(expiresAt) || expiresAt <= nowSeconds) return false;
  return isSameString(token.slice(separator + 1), await sign(env, stamp));
}

export async function hasValidSession(env: Env, request: Request): Promise<boolean> {
  return (
    isPasswordOff(env, request) || isValidSessionToken(env, readCookie(request, SESSION_COOKIE))
  );
}

export function clientKey(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export async function retryAfterSeconds(
  env: Env,
  key: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<number> {
  const row = await env.DB.prepare("SELECT count, first_at FROM login_attempts WHERE ip = ?")
    .bind(key)
    .first<{ count: number; first_at: number }>();
  if (!row) return 0;
  if (nowSeconds - row.first_at >= WINDOW_SECONDS) {
    await clearFailures(env, key);
    return 0;
  }
  return row.count >= MAX_FAILURES ? row.first_at + WINDOW_SECONDS - nowSeconds : 0;
}

export async function recordFailure(
  env: Env,
  key: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO login_attempts (ip, count, first_at) VALUES (?, 1, ?) ON CONFLICT(ip) DO UPDATE SET count = count + 1",
  )
    .bind(key, nowSeconds)
    .run();
}

export async function clearFailures(env: Env, key: string): Promise<void> {
  await env.DB.prepare("DELETE FROM login_attempts WHERE ip = ?").bind(key).run();
}

export async function requireRelayToken(env: Env, request: Request): Promise<Response | null> {
  const given = request.headers.get("X-Relay-Token") ?? "";
  if (!env.RELAY_TOKEN || !given || !(await safeEqual(given, env.RELAY_TOKEN)))
    return jsonError("Relay token required", 401);
  return null;
}
