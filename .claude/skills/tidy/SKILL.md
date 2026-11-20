---
name: tidy
description: Maintenance pass on brain-engine - dead code, duplication, oversized files, single-use tokens, stale or bloated docs, root clutter, old branches and worktrees. Use when the owner asks to clean up, run fallow, remove dead code or duplicates, trim tokens, check the docs, or clear old branches, or after a big feature lands.
---

# Tidy

Pick the modes the owner asked for. Run them one at a time. Fix, don't report, unless the owner asked for a report.

## Modes

### Code

1. Run fallow `analyze` (or `fallow dead-code --format json --quiet | jq`). Fix critical and high first.
2. Dead exports and files: delete them. Check with `symbol_impact` first. Engine dead code is tracked as #6 in `docs/plan/handoff.md`.
3. Duplication: `find_dupes`. Merge copies into one part or one `lib/` function. In the app, two parts for one idea become one part with a variant (see `web-ui.md`).
4. Complexity and size: `check_health`, `npm run size`. Split a file over 200 lines by role, not by line count.
5. Read a part's render before you judge its name. Rename by the table in `web-ui.md` Naming.

### Tokens

1. A token is shared by many parts: colour, font family, font size, line height, space, radius, shapes, control size, layout, motion. Nothing else.
2. A token used once moves into that part's CSS. A run of near-identical tokens (the same tint on many colours) becomes one `color-mix()` at the use site.
3. Edit `app/tokens/*.ts`, then `npm run tokens` and `npm run contrast`. Never edit `design-tokens.css` by hand.

### Docs

1. Use the `docs-auditor` agent. It returns stale, wrong and bloated lines.
2. A doc gives context for one area of work. Cut history, past decisions and anything the code already says. The code is the source of truth for values.
3. Delete a superseded doc. Never archive it. Update the links to it.
4. Rules docs stay in plain words, one idea per line, owner words only.

### Layout

- The root holds six folders and no code. Move strays into `engine/`, `app/`, `worker/`, `ops/`, `starter/` or `docs/`.
- Scripts at the root `package.json` run the right package (`build`, `deploy`, `dev`).

### Branches and worktrees

1. List them: `git branch -vv`, `git worktree list`, `.claude/worktrees/`. For each, say ahead/behind `main` and the last commit line.
2. Ask the owner before you delete any. Never delete `main` or a branch with unmerged work the owner has not seen.

## Rules

- One commit per mode, by path. Run `npm run gates` before each commit.
- Never change behaviour in a tidy commit. A behaviour fix is the `fix-bug` skill.
- `rm` is blocked for agents. Delete files with `git rm <path>`, or list them for the owner.
- A failing gate in a file you did not touch is another agent's work. Say so in one line.

## Report

One line per mode: what was removed or merged, with counts. Then anything left that needs the owner's yes.
