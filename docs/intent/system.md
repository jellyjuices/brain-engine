# Intent: System

**Intent:** one copy of the brain, on one always-on machine, that every device and agent can reach, for free and with near-zero upkeep.

## Problem

- Two copies of the notes drift apart.
- Paid AI and background runs cost money, and stall when usage runs out.
- App code and notes in one repo mix half-done work into the daily commit.
- Each part of the code reads to-do lines its own way.

## Outcomes

1. The home server holds the one copy of the brain.
2. The phone and the laptop send every add and edit to the server. They may keep a read-only copy for offline Find (see [find.md](find.md)).
3. On the laptop, the brain opens as a menu bar popover and as a window.
4. Agents work with the brain through an MCP server at `/mcp`, inside the brain server on the server.
5. One shared to-do line module reads and writes to-do lines for the CLI, the app and the Worker.
6. Sorting and search run with no paid service.

## User

The owner, on any device. Also the agents that read and write the brain for them.

## Constraints

- Local and free. No paid AI. Ollama runs on the home server later.
- Until Ollama runs, Claude works only in chats the owner starts. No background Claude runs.
- Embeddings run inside brain with Transformers.js, on the server and in the app, with the same small model (see [find.md](find.md)).
- The phone is Android with Chrome. The laptop is a MacBook. The home server is a Mac mini.
- The terminal CLI is not a goal. It can be deprecated once the MCP server covers what agents need.
- The daily auto-commit of the notes stays.
- App code lives in the brain engine repo, apart from the notes. The engine holds no personal data, so anyone can fork it.
- Background jobs call Node by a fixed path.
- The notes' git history is their backup. It stays private and local on the server. The notes have no GitHub or other remote, no off-site backup, no backup folders, no archive copies of work docs.
- A superseded doc is deleted, not kept.
- The owner is the only user. There is no live state to protect during changes.
- Order of work: align these docs, then a migration plan, then docs, restructure and cleanup, then the UI last.
