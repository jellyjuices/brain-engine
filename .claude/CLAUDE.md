# Claude Code

The rules for this repo are in AGENTS.md, imported below. This file adds Claude Code workflow only.

@../AGENTS.md

## Gates

Run `npm run gates` from the root before you finish. It runs every gate in every package and the privacy scan, then fails at the end if any failed.

After a web app change, use the `web-reviewer` subagent. It runs the gates and returns findings only.

## Reading code: small outputs only

Reason: big tool output stays in the chat and is read again on every call.

- fallow is the code map. For who imports a file or export, use the `fallow` MCP tools: `trace_file`, `trace_export`, `symbol_impact` before you edit anything exported. Run `audit` on changed files before you finish.
- Read one file at a time. Use `offset` and `limit` for files over 200 lines.
- Every `grep` names a path and ends in `| head -30`.
- Pipe long output (`npm test`, `vitest`, `lint`, `git diff`) through `| tail -20`.
