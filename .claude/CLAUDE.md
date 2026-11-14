# Claude Code

The rules for this repo are in AGENTS.md, imported below. This file adds Claude Code workflow only.

@../AGENTS.md

## Gates

| Where | Run | All must pass |
| --- | --- | --- |
| root | `npm run typecheck`, `npm test`, `npm run size` | yes |
| `web/app` | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run size`, `npx vitest run`, `npm run build` | yes |
| `web/worker` | `npm run typecheck`, `npm run lint`, `npm test`, `npm run size` | yes |
| `design-system` | `npm run typecheck` | yes |

After a web app change, use the `web-reviewer` subagent. It runs the gates and returns findings only.

## Reading code: small outputs only

Reason: big tool output stays in the chat and is read again on every call.

- For who imports a file or export, use the `fallow` MCP tools: `trace_file`, `trace_export`, `symbol_impact` before you edit anything exported. Run `audit` on changed files before you finish.
- Read one file at a time. Use `offset` and `limit` for files over 200 lines.
- Every `grep` names a path and ends in `| head -30`.
- Pipe long output (`npm test`, `vitest`, `lint`, `git diff`) through `| tail -20`.
