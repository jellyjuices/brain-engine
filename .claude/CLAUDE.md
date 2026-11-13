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

- Start with the `crg-brain-engine` MCP tools (code-review-graph): where a symbol lives, who calls it, what a change breaks. Pass `detail_level: "minimal"` and a result cap on every call. Run `get_impact_radius_tool` before you edit anything exported.
- Read one file at a time. Use `offset` and `limit` for files over 200 lines.
- Every `grep` names a path and ends in `| head -30`.
- Pipe long output (`npm test`, `vitest`, `lint`, `git diff`) through `| tail -20`.

## Hooks

- After an edit, a hook updates the code graph.
- When a session starts, a hook prints the code graph status.
- Before `Grep`, `Glob`, `grep` or `rg`, a hook may remind you that the code graph exists. It is a reminder, not a block.
