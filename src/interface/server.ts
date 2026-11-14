// `brain serve`: the Mac side of the phone app. JSON over node:http on loopback only.
//
// Every /api/ route except /api/health needs `Authorization: Bearer <token>`. The Worker adds it; the
// phone never holds it. Writes call the same functions as the `brain` command, so they log to
// .log.jsonl and `brain undo` can reverse them.
//
// DECISION: a to-do ref is the stable `path::text` string (an event's ref is its note path). List
// numbers are only for the terminal, because they change between two reads.

import { createServer as httpServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { addFile, addJournal, addPerson, addSubject, doneRoute, dropRoute, editNote, inboxDrop, moveRoute, setBirthday, sortRoute, undoRoute } from "./server-writes.ts";
import { cardRoute, health, inbox, intakeNext, intakeSave, intakeSkip, listRoute, notesSince, oneNote, report, searchRoute, todayRoute } from "./server-reads.ts";
import { type Ctx, readBody } from "./server-context.ts";
import { calendarFeed } from "../todos/calendar.ts";
import { DEFAULT_PORT, HttpError, isAuthorized, isLocalApp, loadToken, serveApp, tokenPath } from "./server-auth.ts";

type Handler = (c: Ctx, rest: string) => unknown;

class TextBody {
  readonly text: string;
  readonly type: string;
  constructor(text: string, type: string) {
    this.text = text;
    this.type = type;
  }
}

const calendarRoute: Handler = (c) => new TextBody(calendarFeed(c.root), "text/calendar; charset=utf-8");

const EXACT: Record<string, Handler> = {
  "GET /api/notes": notesSince,
  "GET /api/search": searchRoute,
  "GET /api/card": cardRoute,
  "GET /api/today": todayRoute,
  "GET /api/list": listRoute,
  "GET /api/cal.ics": calendarRoute,
  "POST /api/inbox": inbox,
  "POST /api/people": addPerson,
  "POST /api/journal": addJournal,
  "POST /api/subjects": addSubject,
  "POST /api/sort": sortRoute,
  "POST /api/inbox-drop": inboxDrop,
  "POST /api/files": addFile,
  "POST /api/birthday": setBirthday,
  "POST /api/done": doneRoute,
  "POST /api/move": moveRoute,
  "POST /api/drop": dropRoute,
  "POST /api/undo": undoRoute,
  "GET /api/intake/next": intakeNext,
  "POST /api/intake/save": intakeSave,
  "POST /api/intake/skip": intakeSkip,
};

const PREFIX: [string, string, Handler][] = [
  ["GET", "/api/notes/", oneNote],
  ["PUT", "/api/notes/", editNote],
  ["GET", "/api/reports/", report],
];

function findHandler(method: string, pathname: string): { handler: Handler; rest: string } {
  const exact = EXACT[`${method} ${pathname}`];
  if (exact) return { handler: exact, rest: "" };
  for (const [m, prefix, handler] of PREFIX) if (m === method && pathname.startsWith(prefix)) return { handler, rest: pathname.slice(prefix.length) };
  const known = Object.keys(EXACT).some((k) => k.endsWith(` ${pathname}`)) || PREFIX.some(([, p]) => pathname.startsWith(p));
  throw new HttpError(known ? 405 : 404, known ? "Method not allowed." : "Not found.");
}

export function send(res: ServerResponse, status: number, body: unknown): void {
  const isText = body instanceof TextBody;
  const data = isText ? body.text : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": isText ? body.type : "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(data) });
  res.end(data);
}

async function handle(root: string, token: string, req: IncomingMessage): Promise<unknown> {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (!url.pathname.startsWith("/api/")) throw new HttpError(404, "Not found.");
  if (url.pathname === "/api/health") return health(root);
  if (!isAuthorized(req, token) && !isLocalApp(req, token)) throw new HttpError(401, "A token is needed.");
  const { handler, rest } = findHandler(req.method ?? "GET", url.pathname);
  const hasBody = req.method === "POST" || req.method === "PUT";
  return handler({ root, url, body: hasBody ? await readBody(req) : {} }, rest);
}

/** The server, not yet listening. Tests call this with a temp brain and a test token. */
export function createServer(root: string, token: string): Server {
  return httpServer((req, res) => {
    if (!(req.url ?? "/").startsWith("/api/")) {
      try {
        return serveApp(req, res, token);
      } catch (e) {
        return send(res, 400, { error: (e as Error).message || "Bad request." });
      }
    }
    handle(root, token, req).then(
      (body) => send(res, 200, body),
      (e: unknown) => {
        if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.extra });
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
