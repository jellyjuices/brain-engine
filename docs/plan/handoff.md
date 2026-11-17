# Handoff: the brain migration

Written 2026-11-16 by Claude. It replaces the earlier handoff of the same day. The owner pays for usage out of pocket: read section 6 before you start any agent.

## 1. Where things are

`<engine>` is this repo. `<notes>` is the owner's private notes folder. Worktrees sit beside the engine in `brain-engine-wt/`.

| What | Where |
| --- | --- |
| Intent (source of truth) | [docs/intent/](../intent/README.md) |
| Plan, all steps | [plan.md](plan.md) |
| Search design | [search.md](search.md) |
| After the Mac mini: move, MCP, meaning search | [post-mac-mini.md](post-mac-mini.md) |
| Add flows per kind, with the owner's answers | [add-flows.md](add-flows.md) |
| Layout for the UI | [docs/design/concept-a.md](../design/concept-a.md). The wireframe pictures stay in `<notes>/.reports/design-v2-2026-11-12/` because they show real notes |
| Add panel behaviour list | [docs/design/add-panel-behaviours.md](../design/add-panel-behaviours.md) |
| Test rules for agents | `.claude/skills/write-tests/` |

What stays in the notes folder: its own `AGENTS.md`, `.claude/` rules and skills, and the reports the `brain` command makes. Nothing about the engine's code lives there.

## 2. Rules that cost the most when broken

- The owner approves every structure, tech and design change. Read "yes" narrowly.
- Notes repo: agents never push. Stage by path. Never `git add -A`, stash, reset or `rm`.
- Engine: never push `main`. The owner pushes it. A push runs `npm run gates` through the hook in `.git/hooks/pre-push`. `npm install` copies it there from `ops/hooks/`.
- The engine is public. No personal data. Test text is made up.
- Talk to the owner in plain words, one idea per sentence, with the word list in `AGENTS.md`.
- A visual or interaction change is not done until someone has looked at it on a screen. Tests do not see motion, rotation or click-away. This rule was learned the hard way on 2026-11-15.

## 3. Done and on `main`

| Area | State |
| --- | --- |
| Docs, word list, starter, rules | Done |
| Shared to-do line module, `npm run gates`, pre-push hook | Done |
| Today reads real dates. Goal and Decision types. Areas: 1 or more, no upper limit | Done |
| API routes, drafts, helper token, one undo per sort | Done |
| Mac mini | The brain and the engine are on the mini. `ops/setup.sh` ran there. All four jobs are loaded and `brain serve` answers |
| MCP server at `/mcp` | Built and tested. The tool list is cut from 39 to 22. The helper token exists. `/mcp` lists the tools and runs a read with it, and answers 401 with no token. No real client has connected yet |
| Data changes (`area` to `areas`, General) | Applied to the notes |
| Goal percent, wins, decide-by | Done |
| Journal: one note per journal, title from first words, `sorted` field | Done |
| Search: shared module, index v4, typo, Japanese, Spanish, route, app search (S1, S2, S3, S6) | Done. Meaning search is off until the Mac mini |
| Calendar feed, live at the Worker, names only in titles | Done and deployed |
| UI 4.1: shared parts in the design system | Done |
| UI 4.2: shell with tab bar, rail, popover layout, hold-and-drag on Add | Done |
| Linaria step A: design system styles in `css` blocks | Done |
| Add panel behaviour list (work item 1) | Done |
| Linaria in the app, slice 1: setup and design system link, no part moved | Done, commit `7edc8d5` |

`main` is ahead of `origin/main`. The owner pushes it.

## 4. In flight on branches

| Branch | Worktree | State |
| --- | --- | --- |
| `private-history` | none | 61 commits that are not on `main`. Kept until the owner says what it is for |
| `ccr-e18c5284-k7y85f` | none | 9 commits of Find work from a cloud session, not on `main`. Kept until the owner looks |

On 2026-11-16 the owner deleted the later Linaria slices and the first To-dos screen try (`linaria-slice-2`, `linaria-app`, `ui-4.3`). They failed. Slice 1 stays on `main`: the app has the Linaria setup and the design system link, and no part has moved.

What was learned from the Linaria tries: moving the whole app at once damaged the Add panel and the inputs. One cause is known: Linaria makes `@keyframes` names private to the `css` block they are in, so shared keyframes go in one global CSS file.

Two stray edits sit uncommitted in the main checkout. Their authors are unknown. The owner keeps or discards them:
- `web/design-system/src/components/calendar/calendar.tsx` (was `design-system/...`): one deleted line (`text-decoration: line-through`).
- `package.json`: `bin` and `engines` moved below `scripts`. The layout branch rewrites this file, so discard this edit before the merge.

## 5. Work left, scoped by agent size

Small = Sonnet, under 1 hour, a few files. Medium = Sonnet, half a day. Large = Opus at medium effort, one clear module.

| # | Work | Size | Needs | Notes |
| --- | --- | --- | --- | --- |
| 3 | App join, slice 2 onward: one part family per slice (cards, buttons, sheets, to-do row, toast, Add panel last) | Medium each | none | The first try at slice 2 was deleted. Stop after each slice for the owner to look |
| 4 | Close the 12 API gaps in [add-flows.md](add-flows.md) (fields on `make_note`, `when` and kind on `/api/add`, Japanese file names, `# Outcome` heading, project "finished") | Medium | none | Engine `src/` only. Independent of the UI |
| 5 | UI 4.3: To-dos screen with views, Sort screen | Large | item 4 for full data | Not started. The first try was deleted |
| 6 | UI 4.4: Add sheet and builders, from [add-flows.md](add-flows.md) | Large | items 4, 5 | The owner's 7 answers are at the end of that file |
| 7 | UI 4.5: page, goal page, decision page, Connections | Large | item 5 | |
| 8 | UI 4.6: Find with the answer card, Brain tab, Settings | Medium | item 5 | Find already works offline |
| 9 | UI 4.7: delete old screens (`inbox`, `today`, `report`, `write`, `new`) | Small | items 5 to 8 | The owner runs any `rm` |
| 10 | Sorter (plan 2.11): rules, fuzzy names, `· check` when unsure | Large | journal is done | The nearest-neighbour step (S5) waits for the Mac mini |
| 11 | Dead code (plan 3.2) with fallow | Medium | no other agent in `src/` | 100 unused items were found on 2026-11-12; run fallow again first |
| 12 | Test cleanup: `if` and `for` in tests, files with no failure case | Small | none | Low value until the UI screens settle |
| 13 | Mac mini: helper token, first MCP client, MCP in the docs, old commands removed, meaning search | See [post-mac-mini.md](post-mac-mini.md) | the owner makes the token and approves the model download | The move and the tool list cut are done |

Items 4, 10 and 11 do not touch the app's styles. Never run two agents in the same folder: each one gets its own git worktree.

## 6. How to spend few tokens

- One agent at a time. Two only when their folders do not overlap.
- Give each agent: the worktree path, the files it may edit, the one goal, the checks to run, a report cap of 100 words.
- Tell it to read only named files, to batch edits, and to run only the checks of the package it touched. The pre-push hook runs the full gates when the owner pushes.
- Continue an agent that knows the code. Do not start a fresh one for a follow-up.
- Sonnet for all mechanical work. Opus at medium only for a new screen or module. Never Haiku.
- The overseer does one-line edits itself and does not re-read large files.
- A cloud session suits long test work. It sends no report: look for its branch or pull request.
- Commit small and often, so a usage stop loses nothing.

## 7. Checks

Install once, at the root: `npm install`. It covers the engine, the app, the Worker and the design system.

| Where | Command |
| --- | --- |
| Engine, everything | `npm run gates` (the pre-push hook runs it) |
| App only | in `web/app`: `npm run typecheck`, `npm test`, `npm run build` |
| Engine code only | in `engine`: `npm test`, `npm run check` |
| Design system only | in `web/design-system`: `npm run typecheck`, `npm test`, `npm run build-storybook` |
| Notes | `brain check` |
| Look at the parts | in `web/design-system`: `npm run storybook`, port 6006 |
| Look at the app | in `web/worker`: `npm run dev`; in `web/app`: `npm run dev`; open port 5173 on this machine |

## 8. Leftovers

- Work happens in the main checkout, on `main`, with no worktrees. The owner said so on 2026-11-16. A worktree is only for two agents that write code at the same time.
- `brain serve` and the jobs run from this checkout on the mini. Keep the gates passing between commits. Restart the server after a server change: `launchctl kickstart -k gui/$(id -u)/com.brain.serve`.
- Paths in [plan.md](plan.md), [search.md](search.md) and [add-flows.md](add-flows.md) are from before the layout change: `src/` is now `engine/src/`, `shared/` is `engine/shared/`, `design-system/` is `web/design-system/`.
- `~/.config/brain/privacy-words.txt` does not exist, so the privacy scan checks nothing.
- TypeScript and `@types/node` come in two versions: 5.9 and 22 for the engine and the Worker, 7.0 and 26 for the app and the design system. One version for all is a tech change for the owner to approve.
- The app's CSS and lint: 15 React warnings in old screens. The new screens replace most of them.
- In the notes folder, for the owner to delete: the engine docs now copied here (`.reports/migration/`, `.reports/add-flows-2026-11-14/`, `.reports/design-v2-2026-11-12/concept-a.md`), the stale reports (`.reports/tech-review-2026-11-12`, `retro-2026-11-13`, `mobile-screens-2026-11-08`), the 22 sorted captures in `.archive/` and the empty `threads/` folder.
