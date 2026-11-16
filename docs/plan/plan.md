# Migration plan: from today to the approved intent

2026-11-13 · written by Claude · intent: `brain-engine/docs/intent/` · updated with the owner's answers to D1, D2, D3, D5, D6 · search design: [search.md](search.md)

Sizes: S under a day, M 1 to 3 days, L more. ∥ = no shared files, can run at once. E = engine, N = notes.

## Phase 1: Docs

| # | What | Where | Test | Size | Needs |
| --- | --- | --- | --- | --- | --- |
| 1.1 | Write the D1 and D6 answers into the intent: capture deletion and Find | E `docs/intent/helpers.md`, `add.md`, `find.md` | the owner reads | S | none |
| 1.2 | Engine agent docs: intent word list, CLI legacy, MCP at `/mcp`, mini as host, daily `git add -A` as the one exception | E `AGENTS.md`, `.claude/CLAUDE.md`, `.claude/rules/*`, `README.md` | T7 | S | 1.1 |
| 1.3 | Starter agent files, short: no inbox flow, no `.backup/` tars; add General, goals, decisions, journal day note, `check`, `toward`, feelings; sort skill only splits waiting journal entries | E `starter/AGENTS.md`, `starter/.claude/**` | T7; `setup.sh --no-jobs` to a temp folder, `brain check` | M | 1.1 |
| 1.5 | Rename commands and words now: triage to sort, loops to to-dos, drop to delete; old names stay as hidden aliases until 3.1 | E `src/interface/cli*.ts`, `menu.ts`, `ui-*.ts`, `swiftbar/` | T7; gates | S | none |
| 1.4 | Notes agent docs: starter wording plus owner bits only (lens privacy, ClickUp, Notion). Drop engine rules, `web-reviewer`, code-graph section, old `.brain/intent/` | N `AGENTS.md`, `README.md`, `.claude/CLAUDE.md`, `rules/notes.md`, `rules/lenses.md`, `skills/*` | `brain check`; diff vs starter | M | 1.3, 1.5 |

Flow: 1.1 ∥ 1.5, then 1.2 ∥ 1.3, then 1.4.

## Phase 2: Restructure

| # | What | Where | Test | Size | Needs |
| --- | --- | --- | --- | --- | --- |
| 2.1 | One shared line module: parse, format, all tokens. Keeps unknown tokens (fixes the fold-into-text bug) | E new `shared/line/`; deletes both `loops.ts` copies | T1, T2 | M | none |
| 2.2 | One gates command for all packages, plus a privacy grep | E root `package.json` | itself | S | none |
| 2.3 | Today reads `due` only, everywhere. First, one short chat with the owner dates the 9 undated lines | E `src/todos/`, app `today.ts`; N the 9 lines | T1 | S | 2.1 |
| 2.4 | Goal and Decision types; `areas` 1 to 3; `parent` one level; relations; templates | E `src/core/`, `starter/`; N `.schema/`, `.templates/` | T5 | M | 2.1 |
| 2.5 | API as the one way in: new routes, Unsorted count, resumable flows, agent token, re-index and check per write, one undo per sort. An add with a tag, person or relation counts as sorted: filed and the capture deleted, no helper | E `src/interface/server-*.ts`, `src/core/log.ts` | T3 | L | 2.1 |
| 2.6 | Build MCP at `/mcp` in `brain serve` now, one tool per route; skills use it. Runs from 2.7 | E new `src/interface/mcp*.ts`; starter and N skills | T4 | M | 2.5 |
| 2.7 | When the mini arrives: move to it, start `/mcp`; MacBook and phone become remote inputs. Nothing else waits on this step | mini; E `setup.sh`, `launchd/` | `launchd/status.sh`, phone add test, `/mcp` answers | M | 2.6, the mini |
| 2.8 | Migrations: `area` to `areas`, `areas/general.md`, people-only `inbox/` to-dos to General (capture deleted), old words in `.archive/`. | E `migrations/`; N notes | T6; the owner reads the dry-run | M | 2.4 |
| 2.9 | Whole journal entries in `journal/YYYY-MM-DD.md`; bits link back | E server routes, `shared/line/` | T3, T6 | S | 2.4, 2.5 |
| 2.10 | Goal percent and Wins, decide-by to-do, decisions under goals | E `src/reports/`, server reads | fixture brain tests | M | 2.4 |
| 2.11 | Sorter in the pull job: rules plus learned moves, fuzzy, then the nearest-neighbour step (S5). Unsure: best guess plus `· check`. A sorted capture is deleted. Feeling lines get `· about <words>` (D4) | E new `src/sort/`, `src/capture/pull.ts` | T8 | L | 2.5, 2.9, S2 |
| S1 to S6 | Search steps from [search.md](search.md) (Pixel, Chrome). S6 replaces the old 2.12 | E `shared/search/`, `src/core/`, server, MCP, app | T9 in search.md | L in all | 2.1, 2.5, 2.6 as search.md lists |

Flow: 2.1 ∥ 2.2; then 2.3 ∥ 2.4 ∥ 2.5 ∥ S1; then 2.6 ∥ 2.8 ∥ S2; then 2.9 ∥ 2.10 ∥ S3; then S4, 2.11 with S5, S6. 2.7 slots in whenever the mini arrives.

## Phase 3: Cleanup

| # | What | Where | Test | Size | Needs |
| --- | --- | --- | --- | --- | --- |
| 3.1 | Once MCP is done, delete the terminal commands it covers, the old-name aliases, `tag`, weekly review and old reports. Keep what jobs and hooks run (index, check, serve, pull, migrate) | E `src/todos/`, `src/interface/cli*`, `daily.sh` | gates, `brain help` | M | 2.6, 2.11 |
| 3.2 | Dead code, the 2026-11-05 migration, old-word readers | E | unused-export scan | S | 2.8, 3.1 |
| 3.3 | Notes layout: remove `scripts/`, `.code-review-graph/`, `.mcp.json`, `launch.json`, root report, and the sorted captures in `.archive/` (git keeps them); `.archive/` holds finished notes only | N | `brain check`; the owner deletes | S | 1.4 |
| 3.4 | Stale reports and old mockups | N `.reports/` | The owner reviews the list | S | 3.1 |

3.1 then 3.2. 3.3 ∥ 3.4 ∥ 3.1.

## Phase 4: UI (Concept A)

| # | What | Where | Test | Size | Needs |
| --- | --- | --- | --- | --- | --- |
| 4.1 | Shared parts: tokens, area colour mixes, to-do row, timeline line, banner, bar, sheet, builder step | E `design-system/` | stories build, a11y checks | M | Phase 2 |
| 4.2 | Shell: tab bar, wide left rail, menu bar popover | E `web/app/src/shell/` | screen tests | M | 4.1 |
| 4.3 | To-dos and views, Unsorted banner, Sort screen | E `screens/todos`, `screens/sort` | screen tests | L | 4.2 |
| 4.4 | Add sheet and builders, with resume | E `screens/add`, `flows/` | flow tests | L | 4.2 |
| 4.5 | Page, goal page, decision page, Connections | E `screens/page`, `goal`, `decision` | screen tests | L | 4.2 |
| 4.6 | Find with smart suggestions, Brain tab, Settings statuses | E `screens/find`, `brain`, `settings` | screen tests | M | 4.2 |
| 4.7 | Delete old screens (`inbox`, `today`, `report`, `write`, `new`) | E `web/app/src/screens/` | gates | S | 4.3 to 4.6 |

4.1, 4.2; then 4.3 ∥ 4.4 ∥ 4.5 ∥ 4.6; then 4.7.

## Tests to add

- **T1 Golden lines.** One JSON file of `{ line, parsed }` pairs, run by node:test and Vitest. New tokens add rows first.
- **T2 Round trip.** `format(parse(line)) === line`; unknown tokens keep their order; a shuffled-token fuzz.
- **T3 Contract.** The app's queued payload goes through the route into a fixture note and reads back the same. The Worker relays rows byte for byte.
- **T4 MCP.** Each tool maps to one route with the same types; tool list snapshot; no token gets 401.
- **T5 Schema.** Goal and Decision fields, `areas` 1 to 3, no grandchild goals, relation sections parse.
- **T6 Migrations.** Dry run first; a second run changes nothing; fixture brain only.
- **T7 Words.** App strings and agent docs use only intent words.
- **T8 Sorter.** Pure layers on fixture notes; a fake model; a hand-run eval for the 95% bar.
- **T9 Find.** As in search.md: 30 real questions; words plus meaning beats words only. Device and server give the same top hits.

## Risks

- New tokens get damaged on tick before 2.1: write none until T1 and T2 pass.
- Agents write mid-migration: pause them, commit first, hash check per write.
- `.reports/` is not in git, so a delete there is final.
- The mini is the one copy, with no off-site backup. The owner accepts this.
- `/mcp` over the tunnel exposes writes: revocable token, rate limit, T4.
- Notes with no area after 2.8: list for the owner, never guess.
- 3.1 breaks a hook or job: keep index, check, serve, pull.
- If the mini is late, `/mcp` is built but not running: hold 3.1 until it answers, so agents keep a way in.
- The Pixel model download and Chrome storage eviction: fetch once on Wi-Fi, ask for `persist()`, fall back to word search (search.md).
- Private names leak into the engine: privacy grep in 2.2.

## Decisions

Settled by the owner, 2026-11-13:

- **D1:** a capture is deleted once sorted, by a helper or by the owner's own tag, person or relation at add.
- **D2:** build MCP now; it runs once the mini arrives. Nothing else waits on the mini.
- **D3:** one short chat dates the 9 lines.
- **D5:** rename now (1.5); remove once MCP is done (3.1).
- **D6:** words and meaning together, small local model; English by meaning, Japanese and Spanish by words. [search.md](search.md).

Still open:

**D4. Settled by the owner.** A feeling line keeps what it is about as a token: `· about <the owner's words>`, for example `· about the people`. The word "side" is not used. The owner drags a line to change it.
