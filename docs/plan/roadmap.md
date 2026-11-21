# Roadmap

Updated 2026-11-20. This lists what is left to build, and how we know each part is done. The intent for every part is in [docs/intent/](../intent/README.md). When this file and the intent disagree, the intent wins.

## How this file works

Work is split into tracks. Each track has five parts:

- **Intent**: why the track exists, with a link to its intent doc.
- **Done when**: plain checks. Each line is true or false. A reviewer agent can check it against the code or the app. No line like "feels good".
- **Limits**: what must stay true while the work goes on.
- **Now**: what is built today.
- **Steps**: open tasks, with size and what each needs.

A track is done when every "Done when" line is true. Then delete the track. Git keeps the history.

The "Done when" lists work like the rubrics in [Anthropic's guide to defining done for agents](https://platform.claude.com/docs/en/managed-agents/define-outcomes): each line is one clear check, scored on its own.

- **To brief a subagent**: give it the step, the track's intent and its "Done when" lines.
- **To check the work**: give `web-reviewer` or `engine-reviewer` the same lines. The reviewer works in its own context, so it checks the work and not the reasoning.

## How to work here

- Work in the main checkout, on `main`. Commit by path. Never push. The owner pushes.
- No worktrees, unless two agents write the same files at the same time.
- `brain serve` and the jobs run from this checkout on the Mac mini. Keep the gates passing between commits.
- After a change to the server, restart it: `launchctl kickstart -k gui/$(id -u)/com.brain.serve`.
- The owner checks screens by using the app while building. A visual check is not a blocker.
- The owner approves every structure, tech and design change.
- Agent sizes: Small and Medium on Sonnet, Large on Opus at medium effort.
- When a new feature breaks an old test on purpose, build the feature first. Skip the old test and add it to E5.

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
| A | Make `~/.config/brain/privacy-words.txt` | Template: `ops/config/privacy-words.example.txt`. Without it the privacy scan checks nothing |
| B | Say yes to the model download, about 37 GB | Track R. Picks and test in [local-models.md](../design/local-models.md) |
| C | Should a phone add with a sure guess file at once? | [helpers.md](../intent/helpers.md) aim 1 says sorted within minutes. Today every app add waits in Unsorted. Change the intent or the code |
| D | Stage 6 of the intake points to `resources/values-list.md`, which does not exist | Write the list, or drop the file and let stage 6 ask without it |

## Track P: Polish and UX safety

**Intent:** the owner trusts the app on a low-energy day. Calm on the eyes, one way to do each thing, every add shows where it went and offers a fix. See [README](../intent/README.md) constraints 1, 2 and 8.

**Done when:**

- A to-do row matches the container it sits on, on every screen.
- The Add panel's subject chips show only a named subject or a sure guess. A half-typed word never shows a chip.
- The format buttons are ghost at rest. A button shows the pressed look while its format is on.
- Every app write (add, done, move, delete, edit) shows where it went, with Undo. Undo also works on a write still in the offline queue.
- No write loses data without a confirm or an Undo.
- Every screen has a loading, empty, error and offline state, in owner words.
- The manual list in [add-panel-behaviours.md](../design/add-panel-behaviours.md) holds after each style change.

**Limits:** design tokens only. Shared parts from `app/src/components/`. Owner words only.

**Now:** the first three "Done when" lines are true in code. To-do rows take `surface` from every caller. Subject chips need a whole name of 3+ letters or a sure guess, and skip the word still being typed. Format buttons are ghost at rest and pressed while on. The owner has not yet checked them on the phone.

| # | Step | Size | Needs |
| --- | --- | --- | --- |
| P4 | UX safety sweep: list each write and each screen, check Undo, confirm and the four states. Write the gaps here, then fix them in batches | Medium | none |
| P5 | Visual sweep: the owner lists what looks off on the phone, and agents fix it with `build-ui` | Small each | owner list |

## Track S: Sorting

**Intent:** sorting happens for the owner, and they can see and fix it. See [helpers.md](../intent/helpers.md).

**Done when:**

- An add with a sure guess lands in its subject with no sort by the owner. (Waits on C.)
- An add with no sure guess waits in Unsorted. Its row shows the guess, and one tap files it there.
- The owner can clear all of Unsorted in one go: one tap accepts a guess, a second tap picks another subject.
- A filed line can be moved to another subject or re-tagged from the app. The move is logged and can be undone.
- After the owner moves a line, the next add with the same words goes to the new subject.
- A hand-run check on the real brain gives a hit rate, and the number is written here.

**Limits:** no AI needed to sort. A sort writes one log entry. An unsure filing carries `· check`.

**Now:** the shared core is in `engine/shared/sort/`: named subjects first, then the nearest subject by words. `brain pull` files with it. The app sends every phone add with `hold`, so it waits in Unsorted. The Unsorted banner opens the `inbox` screen, one sheet per row. A filed line cannot be moved, and the sorter does not learn.

| # | Step | Size | Needs |
| --- | --- | --- | --- |
| S1 | Sort routes: `GET /api/sorted`, move a filed line, change its tag. Each logged and undoable | Medium | none |
| S2 | Unsorted screen: guess per row, one-tap accept, pick another, clear all in one go, resume where left | Medium | `design-mock` first |
| S3 | Learned moves: a move teaches the sorter | Medium | S1 |
| S4 | Re-guess captures already in Unsorted | Small | C |
| S5 | Hit-rate check on the real brain | Small | owner runs it |
| S6 | Meaning on the phone, once `embedQuery` is real | Medium | none |
| S7 | Shared core: raise `MIN_NAME` in `engine/shared/sort/names.ts` from 2 to 3, to match the app chips | Small | owner yes |

## Track R: Remote work on the Mac mini

**Intent:** the owner runs an intake or a long job on the Mac mini from the phone, from anywhere, without Claude. Local and free. See [system.md](../intent/system.md) and [me-and-intake.md](../intent/me-and-intake.md).

**The gap:** MCP helps only when a Claude chat drives it, so it cannot meet this intent alone. It stays as a thin door for agents. Each route is already a tool, so it costs almost nothing to keep.

**Road (owner said yes, 2026-11-20):** jobs inside `brain serve`. The Mac mini is an Apple M6 with 32 GB of memory and Ollama 0.40 installed, no models yet.

- A job is a note's ask (`split`, `enrich`, `intake`) or a new kind, such as a sort sweep. File asks already store this.
- `brain serve` works through jobs one at a time with a local model (Ollama). Every write carries `generated`, is logged and can be undone.
- The phone shows each job: waiting, working, done or failed.
- The phone app runs the intake itself. The server asks the next question and saves the answer. The local model turns answers into notes and to-dos, as a job.

**Done when:**

- Away from home, the owner starts an intake on the phone, answers questions, and sees the notes and to-dos it made. No Claude.
- The owner adds a file with "split" on the phone and later sees the parts, each marked `generated`.
- The phone shows each job's state. A failed job says why and offers to try again.
- A job never runs twice at once, and it survives a restart of `brain serve`.
- The tunnel check passes: the token works from outside, the rate limit answers 429, a revoked token stops at once.
- With no job running, `brain serve` stays near today's idle cost (0% CPU, about 115 MB).

**Limits:** no paid AI. No background Claude runs. Privacy rules enforced in the server. A helper never speaks first.

**Now:** 24 MCP tools at `/mcp`, tools only, agent token, rate limit. The intake runs as `brain intake` and `brain thread` in a Claude chat. Ollama is not wired in. File asks are stored, but nothing works through them. The tool list and privacy rules in [intake-mcp-spec.md](../design/intake-mcp-spec.md) feed R2 and R4.

| # | Step | Size | Needs |
| --- | --- | --- | --- |
| R1 | Tunnel check from outside | Small | owner says go |
| R2 | Run the model test in [local-models.md](../design/local-models.md), then spec jobs in `brain serve`: routes to list, start and retry | Medium | B |
| R3 | Ollama runner and job worker in `brain serve` | Large | R2 |
| R4 | Intake in the phone app, on server steps. Includes "Start the intake" from a file page | Large | R2, D |
| R5 | Remove `brain intake` and `brain thread`. Update `AGENTS.md`, `brain-cli.md`, CLI help; run `brain migrate` | Small | R4 |
| R6 | Start the server on demand (optional) | Medium | owner wants it |

## Track U: Screens left

**Intent:** each tab does what its intent doc says. See the areas table in the [README](../intent/README.md).

**Done when:**

- Each area in the README has a screen that meets its intent doc.
- No route points at an old screen, and the old screens are gone.
- A draft typed on the phone survives a closed app and a lost signal.

| # | Step | Size | Needs |
| --- | --- | --- | --- |
| U1 | Page, decision page, Connections | Large | none |
| U2 | Find with the answer card, Brain tab, Settings | Medium | none |
| U3 | Saved own views and the Edit view sheet | Medium | an API for saved views |
| U4 | Drafts kept on the device, synced with `save_draft` | Small | none |
| U5 | Delete old screens: `inbox`, `today`, `report`, `write`, `new`. The owner runs any `rm` | Small | U1, U2, S2 |

## Track E: Engine upkeep

**Done when:**

- fallow lists no unused exports in `engine/`.
- No test is skipped, and no test has `if` or `for` in it.
- Goals, subgoals and decisions come from the API. The app never edits a goal note by hand.

| # | Step | Size | Needs |
| --- | --- | --- | --- |
| E1 | Goal API gaps: linked projects in `GoalView`, subgoals and decisions in `/api/goals`, a route to cross off a target | Small | none |
| E2 | Old repeat copies on note pages: check they read well | Small | none |
| E3 | Repeat history line for a to-do in another note: link it to the subject | Small | none |
| E4 | Dead code: 11 unused exports in `engine/` | Small | none |
| E6 | Gates fail on old work: `app/test/lib/notes/goal-draft.test.ts` expects "Sample goal" for the input "Get strong", and Prettier flags 5 files (`list.stories.tsx`, `markdown.test.tsx`, `save-flow.test.ts`, `goal-draft.test.ts`, `goals.test.ts`) | Small | none |
| E5 | Test cleanup. Skipped: `app/test/shell/shell-frame/shell-frame.test.tsx` (tab bar rows; Settings now sits in the To-dos header) and `app/test/shell/unsorted-banner/unsorted-banner.test.tsx` (the banner now sits in To-dos). Brittle: Add panel tests find the blob by part of a class name; `mention.test.tsx` no longer checks the look | Small | after the UI settles |
