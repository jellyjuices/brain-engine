# Handoff: work left

Updated 2026-11-17. This lists only work still to do. The intent for every part is in [docs/intent/](../intent/README.md).

## How to work here

- Work in the main checkout, on `main`. Commit by path. Never push. The owner pushes.
- No worktrees, unless two agents write code at the same time.
- `brain serve` and the jobs run from this checkout on the Mac mini. Keep the gates passing between commits.
- After a change to the server, restart it: `launchctl kickstart -k gui/$(id -u)/com.brain.serve`.
- A visual or interaction change is done only once the owner has looked at it on a screen. Tests do not see motion or click-away.
- The owner approves every structure, tech and design change.
- Agent sizes: Small and Medium on Sonnet, Large on Opus at medium effort.

## Checks

| Where | Command |
| --- | --- |
| Everything | `npm run gates` at the root |
| Engine only | in `engine`: `npm test`, `npm run check` |
| App only | in `web/app`: `npm run typecheck`, `npm test`, `npm run build` |
| Design system only | in `web/design-system`: `npm run typecheck`, `npm test` |
| Notes | `brain check` |

## For the owner

| # | Task | Notes |
| --- | --- | --- |
| A | Push `main` | The pre-push hook runs the gates |
| B | Deploy | The phone gets the Find fix (a subject's card before the answer line) |
| C | Look at Find on a screen | Search a person's name. Their card must come first |
| D | Stop the jobs on the MacBook | On the MacBook: `for j in daily pull serve tunnel; do launchctl bootout gui/$(id -u)/com.brain.$j; done`, then `rm ~/Library/LaunchAgents/com.brain.*.plist`. Only the mini runs the 07:00 job |
| E | Make `~/.config/brain/privacy-words.txt` | Template: `ops/config/privacy-words.example.txt`. Without it the privacy scan checks nothing |

## Mac mini

| # | Task | Size | Notes |
| --- | --- | --- | --- |
| 1 | Tunnel check | Small | The owner said to wait. Test from outside: the helper token works over the tunnel, the rate limit answers 429, a revoked token stops at once. The revoke ends the current token, so the owner makes a new one and runs `claude mcp add` again |
| 2 | Intake tools in MCP | Medium | Only `intake_next`, `intake_save` and `intake_skip` exist. The intake skill still runs `brain intake ...` and `brain thread ...`. Once MCP covers them, remove the `intake` and `thread` commands |
| 3 | Start the server on demand (optional) | Medium | Idle cost today: `brain serve` 0% CPU, about 115 MB RAM; the tunnel 0% CPU, 46 MB. The pull job wakes every 5 minutes. Only worth doing if the owner wants it: launchd socket activation, or a longer pull interval |

## Engine

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 4 | Close the 12 API gaps | Medium | none | Listed in [add-flows.md](add-flows.md): fields on `make_note`, `when` and kind on `/api/add`, Japanese file names, `# Outcome` heading, project "finished". `engine/src/` only |
| 5 | Sorter | Large | none | In the pull job: rules plus learned moves, fuzzy names, then the nearest-neighbour step (S5 in [search.md](search.md)). Unsure: best guess plus `· check`. A sorted capture is deleted. A feeling line gets `· about <words>`. Test: pure layers on fixture notes, a fake model, a hand-run check for a 95% hit rate |
| 6 | Dead code | Medium | no other agent in `engine/src/` | Run fallow first. Known: the numbered day list and the done wrap-up prompts in `engine/src/todos/` are used only by tests, now that the terminal commands are gone |
| 7 | One `@types/node` | Small | owner yes | 22 in the engine and the Worker, 26 in the app and the design system |
| 8 | Test cleanup | Small | after the UI settles | `if` and `for` in tests, files with no failure case |

## App

Design: [concept-a.md](../design/concept-a.md). Add flows: [add-flows.md](add-flows.md). Manual check list for any style change: [add-panel-behaviours.md](../design/add-panel-behaviours.md).

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 9 | Linaria, slice 2 onward | Medium each | none | Slice 1 (setup, no part moved) is on `main`. One part family per slice: cards, buttons, sheets, to-do row, toast, Add panel last. Shared `@keyframes` go in one global CSS file. Stop after each slice for the owner to look |
| 10 | To-dos screen with views, Sort screen | Large | 4 for full data | Use design system parts |
| 11 | Add sheet and builders | Large | 4, 10 | The owner's 7 answers are at the end of [add-flows.md](add-flows.md) |
| 12 | Page, goal page, decision page, Connections | Large | 10 | |
| 13 | Find with the answer card, Brain tab, Settings | Medium | 10 | |
| 14 | Delete old screens: `inbox`, `today`, `report`, `write`, `new` | Small | 10 to 13 | The owner runs any `rm` |

Paths in [add-flows.md](add-flows.md), [search.md](search.md) and [concept-a.md](../design/concept-a.md) predate the folder layout: `src/` is now `engine/src/`, `shared/` is `engine/shared/`, `design-system/` is `web/design-system/`.
