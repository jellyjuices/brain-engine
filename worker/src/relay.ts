import type { Env } from "./auth.ts";
import { json, jsonError } from "./headers.ts";

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ACK_IDS = 500;

interface Row {
  client_id: string;
  created_at: string;
  text: string;
  tags: string;
  received_at: number;
  into_path: string | null;
}

function byteLength(s: string) {
  return new TextEncoder().encode(s).length;
}

function result(row: Pick<Row, "client_id" | "received_at">, duplicate: boolean): Response {
  return json({ ok: true, client_id: row.client_id, received_at: row.received_at, duplicate });
}

const MAX_INTO = 200;

function validInto(into: unknown): into is string {
  if (typeof into !== "string" || !into || into.length > MAX_INTO) return false;
  if (
    !into.endsWith(".md") ||
    into.startsWith("/") ||
    into.includes("\\") ||
    [...into].some((c) => c.charCodeAt(0) < 32)
  )
    return false;
  return !into.split("/").some((part) => part === ".." || part === "." || part === "");
}

function cleanTags(tags: unknown): string[] {
  return Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === "string").slice(0, 20)
    : [];
}

export async function addToInbox(env: Env, request: Request): Promise<Response> {
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > MAX_BODY_BYTES) return jsonError("That capture is too big (64 KB at most)", 413);
  const raw = await request.text();
  if (byteLength(raw) > MAX_BODY_BYTES)
    return jsonError("That capture is too big (64 KB at most)", 413);

  let body: {
    client_id?: unknown;
    text?: unknown;
    created_at?: unknown;
    tags?: unknown;
    into?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError("Send JSON", 400);
  }
  if (typeof body.client_id !== "string" || !body.client_id)
    return jsonError("client_id is required", 400);
  if (typeof body.text !== "string" || !body.text.trim()) return jsonError("text is required", 400);

  if (body.into !== undefined && body.into !== null && !validInto(body.into))
    return jsonError("into must be a note path like areas/fitness.md", 400);
  const into = typeof body.into === "string" ? body.into : null;

  const existing = await env.DB.prepare(
    "SELECT client_id, received_at FROM inbox WHERE client_id = ?",
  )
    .bind(body.client_id)
    .first<Row>();
  if (existing) return result(existing, true);

  const receivedAt = Date.now();
  const createdAt =
    typeof body.created_at === "string" ? body.created_at : new Date(receivedAt).toISOString();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO inbox (client_id, created_at, text, tags, received_at, into_path) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(
      body.client_id,
      createdAt,
      body.text,
      JSON.stringify(cleanTags(body.tags)),
      receivedAt,
      into,
    )
    .run();
  const stored = await env.DB.prepare(
    "SELECT client_id, received_at FROM inbox WHERE client_id = ?",
  )
    .bind(body.client_id)
    .first<Row>();
  return result(
    stored ?? { client_id: body.client_id, received_at: receivedAt },
    stored?.received_at !== receivedAt,
  );
}

export async function pending(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT client_id, created_at, text, tags, received_at, into_path FROM inbox ORDER BY received_at ASC",
  ).all<Row>();
  const items = results.map((r) => ({
    client_id: r.client_id,
    created_at: r.created_at,
    text: r.text,
    tags: JSON.parse(r.tags) as string[],
    ...(r.into_path ? { into: r.into_path } : {}),
  }));
  return json({ items });
}

export async function ack(env: Env, request: Request): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { client_ids?: unknown };
  if (!Array.isArray(body.client_ids)) return jsonError("client_ids must be a list", 400);
  const ids = body.client_ids
    .filter((i): i is string => typeof i === "string")
    .slice(0, MAX_ACK_IDS);
  await Promise.all(
    ids.map((id) => env.DB.prepare("DELETE FROM inbox WHERE client_id = ?").bind(id).run()),
  );
  return json({ ok: true, acked: ids.length });
}
