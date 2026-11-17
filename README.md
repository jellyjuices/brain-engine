# brain-engine

The code behind a second brain project: plain Markdown notes in a folder of your own, and the tools that add, find and sort them. The notes live in a separate folder with its own git.

## Start on a Mac

Needs Node 22.18 or later (`brew install node`) and git.

```
git clone <this repo> ~/Git/brain-engine
~/Git/brain-engine/ops/setup.sh --brain ~/brain
```

Setup fills an empty folder from `starter/`, writes `~/.config/brain/env`, puts `brain` on your PATH, makes the brain folder a git repo, and loads the background jobs. Run `ops/setup.sh --help` for options. Run it again after you move or update the engine, so the jobs find the right paths. It never overwrites a file in your brain folder unless you pass `--force-agent-files`.

Secrets and machine settings live outside the repo, in `~/.config/brain/`. Templates for each file are in `ops/config/`: `env.example`, `relay.env.example` (phone captures) and `web.env.example` (deploys). For the Worker, copy `worker/.dev.vars.example` to `.dev.vars`.

Add, find and tick to-dos in the app. AI helpers use the MCP server at `/mcp`, inside `brain serve`. The `brain` command is for upkeep and intake only; `brain help` lists what it does.

The brain is meant to run on one always-on Mac, such as a Mac mini. It holds the one copy of the notes. A laptop and a phone send adds to it.

## What is here

| Path | What it is |
| --- | --- |
| `engine/` | The `brain` command and `brain serve` (TypeScript on Node, `node:test`): `bin/`, `src/`, `test/`, `shared/` (code the app also reads) and `migrations/` (one-off note migrations) |
| `app/` | The phone and menu bar app (Vite, React), with its design tokens and Storybook |
| `worker/` | The Cloudflare Worker: relay for phone adds, Mac proxy |
| `ops/` | Everything that sets up or runs on the Mac: `setup.sh`, `daily.sh`, `launchd/`, `swiftbar/`, `config/` templates, `scripts/` for the gates, `hooks/` for git |
| `starter/` | What a new brain folder gets |
| `docs/` | Intent, plan, design and setup docs |

## Docs

- What each part is for: [docs/intent/README.md](docs/intent/README.md)
- Phone app and tunnel: [docs/phone-setup.md](docs/phone-setup.md)
- Rules for AI helpers working on this code: [AGENTS.md](AGENTS.md)

## Upkeep

- Every day at 07:00 the daily job indexes and checks the notes, and commits the notes with `git add -A`. If the Mac is asleep, it runs on wake.
- `ops/launchd/status.sh` shows which jobs are loaded and whether `brain serve` answers.
- Logs: `~/Library/Logs/brain/`.
- A push runs the gates first. The hook in `.git/hooks/pre-push` runs `npm run gates` and stops the push if a gate fails. `npm install` at the root copies it there from `ops/hooks/pre-push`.
- `npm run gates` at the root runs every test, typecheck, lint and size gate for every package, plus the privacy grep. The grep reads private words from `~/.config/brain/privacy-words.txt` (template: `ops/config/privacy-words.example.txt`).
- The notes' git history is the backup. There are no backup tarballs or backup folders.

## Licence

MIT. See [LICENSE](LICENSE).
