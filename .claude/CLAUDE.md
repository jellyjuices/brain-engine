# Claude Code

The rules for this repo are in AGENTS.md, imported below. This file adds Claude Code workflow only.

@../AGENTS.md

## Gates

Run `npm run gates` from the root before you finish. It runs every gate in every package and the privacy scan, then fails at the end if any failed.

After a web app change, use the `web-reviewer` subagent. After an engine change, use `engine-reviewer`. Both run the gates and return findings only.

## Skills and agents by request

| Request                                             | Use                                                    |
| --------------------------------------------------- | ------------------------------------------------------ |
| Propose a flow, mock it up                          | `design-mock` skill                                    |
| Build a screen, implement mocks, fix a UI complaint | `build-ui` skill; hand off to the `ui-builder` agent   |
| Something is broken                                 | `fix-bug` skill                                        |
| Write or fix tests                                  | `write-tests` skill                                    |
| Clean up, dead code, tokens, docs, branches         | `tidy` skill; docs check with the `docs-auditor` agent |
| What's next, status, plan or wrap up the work       | `roadmap` skill                                        |
| Search or read across many files                    | `Explore` agent, or pass `model: "sonnet"`             |

## Reading code: small outputs only

Reason: big tool output stays in the chat and is read again on every call.

- fallow is the code map. For who imports a file or export, use the `fallow` MCP tools: `trace_file`, `trace_export`, `symbol_impact` before you edit anything exported. Run `audit` on changed files before you finish.
- Read one file at a time. Use `offset` and `limit` for files over 200 lines.
- Every `grep` names a path and ends in `| head -30`.
- Pipe long output (`npm test`, `vitest`, `lint`, `git diff`) through `| tail -20`.
