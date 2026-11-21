---
description: Rules for the brain command code in engine/ (TypeScript on Node, node:test).
paths:
  - "engine/**"
---

# brain command code

- The `brain` command holds only what jobs, hooks and intake run: index, check, serve, kill, pull, migrate, swiftbar, intake, thread. Add new features as `brain serve` routes, not new commands. Intake and thread leave once MCP has tools for them.
- Run the checks from the repo root: `npm run test:engine`, `npm run check`. Paths below are inside `engine/`.
- `npm run size` fails on any file over 200 lines. Split the file. Never raise the limit. Some old files are still over. If you touch one, split it, or at least do not make it longer.
- Tests never read or copy real notes. Build blank notes with `test/fixture.ts`. Reason: notes are private and other agents change them.
- A test failure in a file you did not touch is likely another agent's work. Say so in one line. Do not fix or revert it.
- Never run `npm run deploy` here. Reason: it deploys the public Worker. The owner does it.
- No comments in code. A good name says what the code does. Put the reason in this file or in `docs/intent/`.

## brain serve and MCP

- `brain serve` is JSON over `node:http` on loopback only. Every `/api/` route except `/api/health` needs `Authorization: Bearer <token>`. The Worker sends the owner token. Your devices never hold it. Helpers send the agent token.
- The agent token is a second bearer token beside the server token in `~/.config/brain/`. The server reads the file on each call, so a new token or a revoke works at once, with no restart. An agent may call every route except the owner-only ones (making or revoking the token), inside a rate limit.
- `POST /mcp` takes only the agent token. The owner token does not open it. Reason: an agent is always the `agent` caller, so owner-only routes stay shut and the agent rate limit always applies. `/mcp` and `/api/` share one `RateLimit` object.
- `/mcp` refuses a browser page on another site (DNS rebinding). Agents send no `Origin`.
- MCP over Streamable HTTP is stateless and dual-era. Modern (2026-07-28 spec): every request carries its version in `_meta` and mirrors it in headers, with no handshake. Legacy (2025-11-25 and earlier): `initialize`, then plain requests, and no session id is minted. Legacy stays because most agent clients still open with `initialize`. `Mcp-Name` may arrive as `=?base64?...?=` when the name is not plain ASCII.
- One MCP tool per route in `routes/table.ts`. Owner-only routes and routes with `mcp: false` are left out. Reason: each tool costs tokens in every agent session. A tool's description is `summary` then `use`, under 30 words together. A call runs the route's handler in process, wrapped as `server.ts` wraps it: snapshot, re-index, check. A result is capped at `MAX_RESULT` bytes.
- In `mcp/schema.ts`, wrap a required field in `req()` and leave an optional one bare. The compiler checks both ways against the request type, so a field added to `api-types.ts` without a schema change does not build.
- After every write, `server-check.ts` re-indexes and checks the notes the write changed. The check reports and never rejects: the write is already on disk and logged, so the owner can undo it. The issues ride on the answer as `check`, only when there are some, with the id of the change so the caller can undo exactly it.
- A device reaches note folders only. `sources/` and hidden folders stay out, and `.archive/` reads only. Verbs throw plain `Error` for things like "No open to-do matches"; the server turns those into 400.
- The changes feed carries `vectors` only for entries embedded since `since`, int8 in base64. A new `model` means fetch all again. `brain pull` and the SwiftBar plugin look for Node in the usual places, because SwiftBar starts plugins with a short PATH.
- A body save (`PUT`) sends `base`, the hash the caller read. A stale `base` gets 409 with the note as it is now.
- Routes that make a note return the existing one when the type and title (or `client_id`) match, so a retry makes no copy. A draft lives in `.brain/drafts/<id>.json`, made by brain and never a note. An add, sort or make with `draft_id` clears it.
- On the home server, the app at `http://127.0.0.1:8787/` opens with no password. The notes are plain files here, so a password adds nothing. The gate is an `HttpOnly`, `SameSite=Strict` cookie made from the token. It counts only when the request came straight to loopback: the `Host` is a loopback name (blocks DNS rebinding), no Cloudflare or proxy headers (the tunnel also connects from 127.0.0.1, so it never gets the app or the cookie), and a write carries this exact `Origin`. There is no service worker on the home server copy, so it always loads fresh from disk.
- `brain swiftbar` prints one line: the scribble icon and the inbox count. The whole menu is the web app from `brain serve`, so it needs no internet and no password. `BRAIN_WEB_URL` points it at another copy. Only the background server asks SwiftBar to redraw. Tests and `--foreground` runs never touch SwiftBar.
- `brain kill` unloads and disables `com.brain.serve` and `com.brain.tunnel`, so they stay off after a restart until `brain serve`. The pull job is left alone: adds from your devices wait in the Worker either way.
- `.log.jsonl` is append only. One write is one entry, so one undo takes it all back. Undo refuses when the newest change cannot be undone, and checks every step before any file changes. A move writes the new file first, then removes the old one.
- `brain pull` writes each item (skipping ones already on disk), then acks. Write always comes before ack.
- `BRAIN_TODAY` overrides today for tests.
