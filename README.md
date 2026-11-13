# brain-engine

The code behind a second brain project: plain Markdown notes in a folder of your own, and the tools that add, find and sort them. The notes live in a separate folder with its own git.

## Start on a Mac

Needs Node 22.18 or later (`brew install node`) and git.

```
git clone <this repo> ~/Git/brain-engine
~/Git/brain-engine/setup.sh --brain ~/brain
```

Setup fills an empty folder from `starter/`, writes `~/.config/brain/env`, puts `brain` on your PATH, makes the brain folder a git repo, and loads the background jobs. Run `setup.sh --help` for options. It never overwrites a file in your brain folder unless you pass `--force-agent-files`.

Secrets and machine settings live outside the repo, in `~/.config/brain/`. Templates for each file are in `config/`: `env.example`, `relay.env.example` (phone captures) and `web.env.example` (deploys). For the Worker, copy `web/worker/.dev.vars.example` to `.dev.vars`.

Then type `brain`.

## What is here

| Path | What it is |
| --- | --- |
| `bin/`, `src/`, `test/` | The `brain` command and `brain serve` (TypeScript on Node, `node:test`) |
| `web/app/` | The phone and menu bar app (Vite, React) |
| `web/worker/` | The Cloudflare Worker: relay, phone inbox, Mac proxy |
| `design-system/` | Tokens and Storybook for the app |
| `launchd/`, `daily.sh`, `swiftbar/` | Background jobs and the menu bar plugin |
| `starter/` | What a new brain folder gets |
| `migrations/` | One-off note migrations |
| `docs/` | Intent and setup docs |

## Docs

- What each part is for: [docs/intent/README.md](docs/intent/README.md)
- Phone app and tunnel: [docs/phone-setup.md](docs/phone-setup.md)
- Rules for AI helpers working on this code: [AGENTS.md](AGENTS.md)

## Upkeep

- Every day at 07:00 the daily job indexes, tags and checks the notes, writes `.reports/today.md` in the brain folder, and commits the notes. If the Mac is asleep, it runs on wake.
- `launchd/status.sh` shows which jobs are loaded and whether `brain serve` answers.
- Logs: `~/Library/Logs/brain/`.

## Licence

MIT. See [LICENSE](LICENSE).
