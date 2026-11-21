# Handoff: work left

Updated 2026-11-20. This lists only work still to do. The intent for every part is in [docs/intent/](../intent/README.md).

## How to work here

- Work in the main checkout, on `main`. Commit by path. Never push. The owner pushes.
- No worktrees, unless two agents write code at the same time.
- `brain serve` and the jobs run from this checkout on the Mac mini. Keep the gates passing between commits.
- After a change to the server, restart it: `launchctl kickstart -k gui/$(id -u)/com.brain.serve`.
- The owner checks screens by using the app while building. A visual check is not a blocker or a handoff row.
- Soon means the next 14 days.
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
| B | Say yes to the sorter plan | See #5 |
| C | Say yes to the intake MCP spec | [intake-mcp-spec.md](../design/intake-mcp-spec.md). It removes `intake_skip` and later the `intake` and `thread` commands |
| D | Stage 6 points to `resources/values-list.md`, which does not exist | Write the list, or say to drop the file and let stage 6 ask without it |

## Mac mini

| # | Task | Size | Notes |
| --- | --- | --- | --- |
| 1 | Tunnel check | Small | The owner said to wait. Test from outside: the helper token works over the tunnel, the rate limit answers 429, a revoked token stops at once. The revoke ends the current token, so the owner makes a new one and runs `claude mcp add` again |
| 2a | Intake tools in MCP | Medium | Waits on C. The tool list, inputs and rules are in [intake-mcp-spec.md](../design/intake-mcp-spec.md). 11 new or changed tools, `undo_id` on each write, privacy enforced in the server |
| 2b | Intake prompt and resources in MCP | Medium | Needs 2a, D. The server offers tools only today. Add `prompts` and `resources`; serve the stages and rules from the brain's own copy |
| 2c | Intake skill and commands cut over | Small | Needs 2a, 2b and a real intake run. The starter skill calls tools; remove `brain intake` and `brain thread`; update `AGENTS.md`, `brain-cli.md`, CLI help; run `brain migrate` |
| 3 | Start the server on demand (optional) | Medium | Idle cost today: `brain serve` 0% CPU, about 115 MB RAM; the tunnel 0% CPU, 46 MB. The pull job wakes every 5 minutes. Only worth doing if the owner wants it |

## Engine

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 5 | Sorter: what is left | Medium | 15 | Done: the shared core in `engine/shared/sort/` (names, then nearest subject by words and meaning, unsure gets `· check`). `brain serve` and `brain pull` use it in `saveItem`, and the phone uses it for the home chips (`app/src/lib/search/sort-on-device.ts`). A to-do with no guess stays a capture; General is no longer the fallback. Left: learned moves (needs 15), sorting captures already in the inbox, meaning on the phone once `embedQuery` is real, and a hand-run check of the hit rate on the real brain |
| 15 | Sort routes | Medium | 5 | `GET /api/sorted` (lines by subject, with kind and `· check`), and routes to move a filed line and change its tag. Each logged, undoable, and teaches the sorter |
| 16 | Goal API gaps | Small | none | A list of linked projects in `GoalView`; subgoals and decisions in `/api/goals`; a route to cross off a target (today the app edits the note) |
| 21 | Old repeat copies on note pages | Small | none | Done copies made before the rolling rule stay as history. Check they read well on a note page |
| 22 | Repeat history line for a to-do in another note | Small | none | Done for now writes `- <date> · Done: <text>` under the to-do. When the to-do lives in another note than its subject, that line does not link to the subject, so it only shows on that note's card |
| 6 | Dead code, rest | Small | none | fallow lists 11 unused exports in `engine/` |
| 23 | File asks without a chat | Large | Ollama, owner yes | `brain serve` works through a file note's `asks` (`split`, `enrich`, `intake`) with a local model, writes with `generated`, then clears each ask. Rules in [helpers.md](../intent/helpers.md) outcomes 11 and 12 |
| 24 | Intake from a file | Medium | 2a | "Start the intake" on a file page opens the normal intake. `intake_next` should ask the file's `# Intake` questions first |
| 8 | Test cleanup | Small | after the UI settles | `if` and `for` in tests, files with no failure case. Skipped against the new criteria: `app/test/shell/shell-frame/shell-frame.test.tsx` (the tab bar and rail rows for To-dos and Goals; "the phone layout reaches Settings from To-dos", Settings is now in the To-dos header); `app/test/shell/unsorted-banner/unsorted-banner.test.tsx` (the whole file: the banner now sits inside the To-dos screen, not the shell). Brittle after the CSS Modules move: the Add panel tests find the blob by part of a class name; `mention.test.tsx` no longer checks the look |

## App

Manual check list for any style change: [add-panel-behaviours.md](../design/add-panel-behaviours.md).

| # | Task | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 18 | Saved own views and the Edit view sheet | Medium | an API for saved views | The To-dos screen has the standard views only |
| 12 | Page, decision page, Connections | Large | none | The goal page and the note page's to-do list are done |
| 13 | Find with the answer card, Brain tab, Settings | Medium | none | |
| 19 | Drafts kept on the device | Small | none | The device keeps its own draft copy and syncs it with `save_draft` |
| 14 | Delete old screens: `inbox`, `today`, `report`, `write`, `new` | Small | 10, 12, 13 | No tab points at `today` or `report` now. The owner runs any `rm` |

