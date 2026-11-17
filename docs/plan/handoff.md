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
- Tests and new features: when a new feature breaks an old test on purpose, build the feature first. Skip the old test and add it to the list under #8. Fix it later, against the new criteria.

## Checks

| Where | Command |
| --- | --- |
| Everything | `npm run gates` at the root |
| Engine only | `npm run test:engine`, `npm run check` |
| App only | `npm run typecheck`, `npm run test:app`, `npm run build` |
| Notes | `brain check` |

## For the owner

| # | Task | Notes |
| --- | --- | --- |
| A | Make `~/.config/brain/privacy-words.txt` | Template: `ops/config/privacy-words.example.txt`. Your surname, street, company and client names. Without it the privacy scan checks nothing |
| B | Merge, deploy and look at the app branch | Branch `worktree-agent-a20820768b9c32f85`: opens on To-dos, back closes sheets first, To-dos views, Goals tab, goal page. Reinstall the app for the new start page. Check back swipes, the Add panel close, sharing into the app, the done toast, the Goals look |
| C | Look at each Linaria slice | Session branch `claude/linaria-slices-b41ccf`. Cards are done and wait for a look |
| D | Soon: 7 or 14 days | The concept says 7, the API says 14. The app uses 14 for now |
| E | Say yes to the intake and sorter plans | See #2 and #5 |

## Mac mini

| # | Task | Size | Notes |
| --- | --- | --- | --- |
| 1 | Tunnel check | Small | The owner said to wait. Test from outside: the helper token works over the tunnel, the rate limit answers 429, a revoked token stops at once. The revoke ends the current token, so the owner makes a new one and runs `claude mcp add` again |
| 2 | Intake tools in MCP | Medium | Plan, waiting on the owner: keep `intake_next`, `intake_save` (with a kind: answer, fact, subject, to-do, role) and `intake_skip`; add `intake_end` and `intake_redact`; serve the intake stages as an MCP prompt so any AI can run an intake. Then the starter skill uses the tools, and the `intake` and `thread` commands go |
| 3 | Start the server on demand (optional) | Medium | Idle cost today: `brain serve` 0% CPU, about 115 MB RAM; the tunnel 0% CPU, 46 MB. The pull job wakes every 5 minutes. Only worth doing if the owner wants it |

## Engine

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 5 | Sorter | Large | owner yes | Inside `brain serve`, as [helpers.md](../intent/helpers.md) says, so it reuses the loaded search model. Rules plus learned moves, fuzzy names, then the nearest-neighbour step (S5 in [search.md](search.md)). Unsure: best guess plus `· check`. A sorted capture is deleted. A feeling line gets `· about <words>`. Also: `saveItem` in `engine/src/capture/pull.ts` now files a `kind: "todo"` with no subject into `areas/general.md`; it must wait for the sorter instead. Test: pure layers on fixture notes, a fake model, a hand-run check for a 95% hit rate |
| 15 | Sort routes | Medium | 5 | `GET /api/sorted` (lines by subject, with kind and `· check`), and routes to move a filed line and change its tag. Each logged, undoable, and teaches the sorter |
| 16 | Goal API gaps | Small | none | A list of linked projects in `GoalView`; subgoals and decisions in `/api/goals`; a route to cross off a target (today the app edits the note) |
| 17 | One home for shared app and engine code | Small | none | The view rules (`engine/src/interface/routes/reads.ts`) and goal types (`engine/src/reports/goals.ts`) are copied in the app. Move them to `engine/shared` |
| 6 | Dead code, rest | Small | none | fallow still lists 21 unused exports in `engine/` |
| 8 | Test cleanup | Small | after the UI settles | `if` and `for` in tests, files with no failure case. Skipped against the new criteria: `app/test/shell/shell-frame/shell-frame.test.tsx`, the tab bar and rail rows for To-dos and Goals. Delete the scratch folder `app/test/tmpx/` in the app worktree |

## App

Design: [concept-a.md](../design/concept-a.md). Add flows: [add-flows.md](add-flows.md). Manual check list for any style change: [add-panel-behaviours.md](../design/add-panel-behaviours.md).

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 9 | Linaria, slice 2 onward | Medium each | none | A session runs it. Buttons, sheets, to-do row, toast, Add panel last. Stop after each slice for the owner to look. The toast now takes a list of buttons on the app branch: expect a small merge conflict |
| 10 | Sort screen | Medium | 15 | Grouped by subject. Tap a tag to change it, + to add one. Long-press, then Move to, first. Drag by a handle is its own task after |
| 18 | Saved own views and the Edit view sheet | Medium | an API for saved views | The To-dos screen has the standard views only |
| 12 | Page, decision page, Connections | Large | none | The goal page is on the app branch |
| 13 | Find with the answer card, Brain tab, Settings | Medium | none | |
| 19 | Drafts kept on the device (G12) | Small | none | The device keeps its own draft copy and syncs it with `save_draft` |
| 14 | Delete old screens: `inbox`, `today`, `report`, `write`, `new` | Small | 10, 12, 13 | No tab points at `today` or `report` now. The owner runs any `rm` |

Paths in [add-flows.md](add-flows.md), [search.md](search.md) and [concept-a.md](../design/concept-a.md) predate the folder layout: `src/` is now `engine/src/`, `shared/` is `engine/shared/`, `design-system/` is now inside the app: `app/src/components/`, `app/tokens/`.
