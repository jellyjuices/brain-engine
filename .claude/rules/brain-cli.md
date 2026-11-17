---
description: Rules for the brain command code in engine/ (TypeScript on Node, node:test).
paths:
  - "engine/**"
---

# brain command code

- The `brain` command holds only what jobs, hooks and intake run: index, check, serve, kill, pull, migrate, swiftbar, intake, thread. Add new features as `brain serve` routes, not new commands. Intake and thread leave once MCP has tools for them.
- Run the checks from `engine/`: `npm test`, `npm run check`. Paths below are inside `engine/`.
- `npm run size` fails on any file over 200 lines. Split the file. Never raise the limit. Some old files are still over. If you touch one, split it, or at least do not make it longer.
- Tests never read or copy real notes. Build blank notes with `test/fixture.ts`. Reason: notes are private and other agents change them.
- A test failure in a file you did not touch is likely another agent's work. Say so in one line. Do not fix or revert it.
- Never run `npm run deploy` here. Reason: it deploys the public Worker. The owner does it.
- No comments in code. A good name says what the code does.
