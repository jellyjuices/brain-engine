# Handoff: work left

Updated 2026-11-19. This lists only work still to do. The intent for every part is in [docs/intent/](../intent/README.md).

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
| B | Look at the app on the phone | The quick add tools (bold, italic, list, tag, mention) above the keyboard; paste into a journal; a note page's one to-do list and its Soon line; repeating to-dos (tick, Skip this time, Stop repeating, the "Every week · Tue" chip); back swipes; dark mode, the goal page and the wide layout were never seen in a screenshot |
| C | Approve the new words | On screen but not in the allowed list: Format, Bold, Italic, List, Mention, Soon, Edit, Not done, Done for now, Skip this time, Stop repeating, Every, Back, Skipped |
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
| 5 | Sorter: what is left | Medium | 15 | Done: the shared core in `engine/shared/sort/` (names, then nearest subject by words and meaning, unsure gets `· check`). `brain serve` and `brain pull` use it in `saveItem`, and the phone uses it for the home chips (`app/src/lib/search/sort-on-device.ts`). A to-do with no guess stays a capture; General is no longer the fallback. Left: learned moves (needs 15), sorting captures already in the inbox, meaning on the phone once `embedQuery` is real, and a hand-run check of the hit rate on the real brain |
| 15 | Sort routes | Medium | 5 | `GET /api/sorted` (lines by subject, with kind and `· check`), and routes to move a filed line and change its tag. Each logged, undoable, and teaches the sorter |
| 16 | Goal API gaps | Small | none | A list of linked projects in `GoalView`; subgoals and decisions in `/api/goals`; a route to cross off a target (today the app edits the note) |
| 21 | Old repeat copies on note pages | Small | none | Done copies made before the rolling rule stay as history. Check they read well on a note page |
| 22 | Repeat history line for a to-do in another note | Small | none | Done for now writes `- <date> · Done: <text>` under the to-do. When the to-do lives in another note than its subject, that line does not link to the subject, so it only shows on that note's card |
| 6 | Dead code, rest | Small | none | fallow still lists 21 unused exports in `engine/` |
| 23 | File asks without a chat | Large | Ollama, owner yes | `brain serve` works through a file note's `asks` (`split`, `enrich`, `intake`) with a local model, writes with `generated`, then clears each ask. Rules in [helpers.md](../intent/helpers.md) outcomes 11 and 12 |
| 24 | Intake from a file | Medium | none | "Start the intake" on a file page opens the normal intake. `intake_next` should ask the file's `# Intake` questions first |
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
| 25 | Look at the where-it-went flows on the phone | Small | owner | Home chips while typing a to-do, the "Added to" toast with Move and Undo, unsorted rows and the sort sheet, the person builder after Add a person, the file page. Spec: [sort-flow-spec.md](../design/sort-flow-spec.md) |

