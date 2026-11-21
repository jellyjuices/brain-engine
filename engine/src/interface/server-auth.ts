import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { homedir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { send } from "./server-send.ts";

export const DEFAULT_PORT = 8787;
export const MAX_BODY = 256 * 1024;
export const MAX_CAPTURE = 64 * 1024;
export const MAX_FILE = 60 * 1024;

export class HttpError extends Error {
  status: number;
  extra: Record<string, unknown>;
  constructor(status: number, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function tokenPath(): string {
  return process.env.BRAIN_TOKEN_FILE || join(homedir(), ".config", "brain", "token");
}

export function loadToken(path = tokenPath(), say: (s: string) => void = () => {}): string {
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, randomBytes(32).toString("base64url") + "\n", { mode: 0o600 });
    chmodSync(path, 0o600);
    say(`Made a new token at ${path}. Use its contents as SERVER_TOKEN in the Worker.`);
  }
  const token = readFileSync(path, "utf8").trim();
  if (!token) throw new Error(`The token file ${path} is empty. Delete it and run brain serve again.`);
  return token;
}

const digest = (s: string) => createHash("sha256").update(s).digest();

export function isAuthorized(req: IncomingMessage, token: string): boolean {
  const match = /^Bearer (.+)$/.exec(String(req.headers.authorization ?? ""));
  return !!match && timingSafeEqual(digest(match[1]), digest(token));
}

export const LOCAL_COOKIE = "brain_local";
const APP_DIR = () => process.env.BRAIN_APP_DIR || join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "app", "dist");
const LOOPBACK_NAMES = new Set(["127.0.0.1", "localhost", "[::1]"]);
const PROXY_HEADERS = ["cf-connecting-ip", "cf-ray", "cdn-loop", "x-forwarded-for", "forwarded"];

export const localSecret = (token: string) => createHmac("sha256", token).update("brain-local-app").digest("base64url");

function isDirectLocal(req: IncomingMessage): boolean {
  if (PROXY_HEADERS.some((h) => req.headers[h] !== undefined)) return false;
  try {
    return LOOPBACK_NAMES.has(new URL(`http://${req.headers.host ?? ""}`).hostname);
  } catch {
    return false;
  }
}

function cookie(req: IncomingMessage, name: string): string | undefined {
  for (const part of String(req.headers.cookie ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export function isLocalApp(req: IncomingMessage, token: string): boolean {
  if (!isDirectLocal(req)) return false;
  const got = cookie(req, LOCAL_COOKIE);
  if (!got || !timingSafeEqual(digest(got), digest(localSecret(token)))) return false;
  if (req.method === "GET" || req.method === "HEAD") return true;
  return req.headers.origin === `http://${req.headers.host}`;
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
};
const PAGE_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Frame-Options": "DENY",
};

const markLocal = (html: string) => html.replace("</head>", `<meta name="brain-local" content="1" />\n</head>`);

export function serveApp(req: IncomingMessage, res: ServerResponse, token: string): void {
  if (!isDirectLocal(req)) return send(res, 404, { error: "Not found." });
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Method not allowed." });
  const dir = resolve(APP_DIR());
  if (!existsSync(join(dir, "index.html"))) return send(res, 503, { error: "The app is not built. Run: npm run build in the brain engine" });
  const path = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const file = resolve(dir, "." + path);
  if (path === "/sw.js") return send(res, 404, { error: "Not found." });
  const isFile = file.startsWith(dir + sep) && existsSync(file) && statSync(file).isFile();
  if (isFile && extname(file) !== ".html") {
    const data = readFileSync(file);
    const cache = path.startsWith("/assets/") ? "public, max-age=31536000, immutable" : "no-cache";
    res.writeHead(200, { ...PAGE_HEADERS, "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": cache, "Content-Length": data.length });
    return void res.end(req.method === "HEAD" ? undefined : data);
  }
  const html = Buffer.from(markLocal(readFileSync(join(dir, "index.html"), "utf8")));
  res.writeHead(200, {
    ...PAGE_HEADERS,
    "Content-Type": TYPES[".html"],
    "Cache-Control": "no-store",
    "Content-Length": html.length,
    "Set-Cookie": `${LOCAL_COOKIE}=${localSecret(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`,
  });
  res.end(req.method === "HEAD" ? undefined : html);
}
