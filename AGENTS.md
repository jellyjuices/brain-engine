# Rules for AI helpers in brain-engine

This repo is the code for a second brain. The notes live in a separate brain folder with its own git. Talk to the owner in plain, simple words, one idea per sentence, active voice. No em dashes. Canadian English.

## How the parts fit

| Part | Where | Notes |
| --- | --- | --- |
| `brain` command | `engine/bin/brain.ts`, `engine/src/` | Upkeep and intake only: index, check, serve, kill, pull, migrate, swiftbar, intake, thread. Adds, to-dos and Find go through `brain serve`. Rules: [brain-cli.md](.claude/rules/brain-cli.md) |
| `brain serve` | `engine/src/interface/server*.ts` | HTTP server for the app and the menu bar. The MCP server for agents runs at `/mcp` inside it, on the Mac mini. A route marked `mcp: false` in `routes/table.ts` is not a tool |
| Shared modules | `engine/shared/` | The to-do line and search code. The engine and the app both read it. The app imports it as `@shared` |
| Phone app | `app/` | Stack: Vite, React 19, TypeScript, CSS Modules on the design tokens. Its design tokens are in `app/tokens/` and its Storybook is `npm run storybook` at the root. Rules: [design-system.md](.claude/rules/design-system.md), [web.md](.claude/rules/web.md), [web-ui.md](.claude/rules/web-ui.md), [web-tests.md](.claude/rules/web-tests.md). On the phone, loaded for web UI work: [phone-preview.md](.claude/rules/phone-preview.md) |
| Worker | `worker/` | Deploy values come from `~/.config/brain/web.env`. See [docs/phone-setup.md](docs/phone-setup.md) |
| Jobs | `ops/launchd/*.plist`, `ops/daily.sh`, `ops/swiftbar/` | Templates; `ops/setup.sh` fills the `__WORDS__` |
| Machine setup | `ops/setup.sh`, `ops/config/`, `ops/scripts/`, `ops/hooks/` | Setup, config templates, the gate scripts and the git hook |
| New brain | `starter/` | Copied into an empty brain folder by `setup.sh` |

Where it runs: one always-on home server, a Mac mini, holds the one copy of the brain. The laptop and the phone send adds and edits to it.

Intent for every part: [docs/intent/README.md](docs/intent/README.md). When the intent and the code disagree, the intent wins: change the intent doc first.

Plan and state of the work: [docs/plan/roadmap.md](docs/plan/roadmap.md). Screen behaviours: [docs/design/](docs/design/add-panel-behaviours.md).

The root holds six folders and no code: `engine/`, `app/`, `worker/`, `ops/`, `starter/` and `docs/`. Put a new file inside one of them, not at the root.

One `package.json` at the root holds every dependency and every script. `npm install` at the root makes the only `node_modules`. There is one `package-lock.json`. Never add a `package.json` or run `npm install` inside `engine/`, `app/` or `worker/`. The install also copies `ops/hooks/pre-push` into `.git/hooks/`.

## Invariants

- **The brain folder comes from config.** `brainHome()` in `engine/src/core/home.ts` reads `BRAIN_HOME`, then `~/.config/brain/env` (or `$BRAIN_CONFIG/env`). There is no default path. Reason: the engine runs against any owner's folder.
- **No personal data in this repo.** No names, domains, ids, tokens or paths of a real owner. Deploy values live in `~/.config/brain/`. Reason: anyone can fork the engine.
- **Tests never touch a real brain.** They build a temp folder from `starter/` with `engine/test/fixture.ts`.
- **Background jobs call Node by a fixed path.** `setup.sh` stores the real path, never a version manager's shell path.
- **`starter/` is a template.** Change it when every new brain should get the change. It never holds an owner's notes.

## Hard rules

- **Never deploy.** Do not run `npm run deploy`, `wrangler deploy` or `ops/go-live.sh`. Reason: a deploy is public. The owner does it. `refuse-under-agent.mjs` and `.claude/settings.json` block it too.
- **Commit by path. Never push to `main`.** The owner pushes `main`. A push to any other branch is fine.
- **Never edit a brain folder from here** except through `setup.sh` or the `brain` command.
- Never run a dev server or Storybook, except as [phone-preview.md](.claude/rules/phone-preview.md) says. Verify with typecheck, lint, tests and build.

## Working alongside other agents

- Re-read a file right before you write it.
- Change files with the Edit and Write tools. Do not edit files with sed, heredocs, Python or Bash scripts.
- Stage only your own files, by path. Never `git add -A` or `git commit -a`. Never stash, reset or check out over files you did not change.
- A failing gate in a file you did not touch is likely another agent's work. Say so in one line.
- The one exception: the daily job (`daily.sh`) runs `git add -A` in the brain folder to commit the notes. Reason: the notes' git history is their backup.

## Work docs

- Delete a superseded doc. Do not archive it. Git keeps the history.
- No backup tarballs and no backup folders. Git is the backup.
- For who imports what, use fallow, the code map. Do not use code-review-graph.

## Words the owner sees

Use only these words in any screen, menu, help text or agent doc: **add, done, move, delete, find, to-do, note, subject, goal, decision, sort, view, journal, intake, When, About what.** Never say absorb, triage, loop, outcome, drop, park or schedule. Code names may still use them. The list comes from [docs/intent/README.md](docs/intent/README.md).
