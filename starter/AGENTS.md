# Rules for AI helpers in this folder

This folder is the owner's second brain: plain Markdown notes, read and written through the `brain` command. Any AI helper (Claude, ChatGPT, Gemini) follows these rules.

Talk to the owner in plain, simple words, one idea per sentence, active voice. No em dashes.

## Rules by area

Read the file for the area you work in. Claude Code loads it on its own.

| Area | File |
| --- | --- |
| Writing notes, to-dos, relations, When tokens | [notes.md](.claude/rules/notes.md) |
| Lens or area for a fact about the owner | [lenses.md](.claude/rules/lenses.md) |

## Folders

`ls` shows the layout. It does not show:

- `inbox/` holds new captures only. Once sorted, the text moves into a subject note and the capture goes to `.archive/`.
- `events/` holds one dated visit, appointment or meeting each, with `date`, `status` (upcoming, done, cancelled) and `with`. Body: `# Prep`, `# To-dos`, `# Outcome`. Make one with `brain new Event "Title" --date YYYY-MM-DD`.
- `groups/`, `places/`, `things/`, `topics/` hold types `Group`, `Place`, `Thing` and `Topic`.
- `resources/` holds type `Note` only. A tag says which kind (decision, meeting, reference, idea).
- `me/` holds one Lens note per lens. Intake settings: `me/settings.yaml`.
- `sources/` is raw material. `sources/intake/` holds the owner's full intake answers.
- Hidden: `.archive/` (finished notes, still searchable), `.templates/`, `.schema/` (types, tags, lens names), `.reports/` and `.brain/` (made by `brain`), `.log.jsonl` (read with `brain log`), `.backup/` (tar backups).

## Trust labels

- When you write or change a note, set `generated: {by: <your name>, at: <ISO time>}`. Leave it off notes the owner writes. Reason: the owner must see which text a helper wrote.
- Only the owner adds `verified`, after they check a helper's note.
- Cite facts from `sources/` or a link in `sources:`.

## Hard rules

- **Never delete a note.** Move it to `.archive/`. Reason: backlinks and the log still point to it.
- **Never edit files in `sources/`.** Reason: it is the record of what the owner really said. The one writer is `brain intake save --raw`. To redact, run `brain intake redact "words"`.
- **Never invent facts about the owner.** If you are not sure, leave it in `inbox/` with a question.
- **Never deploy.** Do not run `npm run deploy`, `wrangler deploy` or the engine's `web/go-live.sh`. Reason: a deploy is public. The owner does it.
- **The brain is the one home for tasks.** Every to-do is a line in its subject note. When a client keeps tasks in their own tool, link to the client's task, do not copy it. Reason: two copies drift, and Today and the menu bar read only the brain.

`.claude/settings.json` blocks edits to `sources/`, `rm` and deploys. Do not weaken that.

## Working alongside other agents

Other agents and scripts write in this folder too.

- **Re-read a file right before you write it.** Reason: a copy you read earlier undoes their work.
- Never stash, reset or check out over files you did not change. Stage only your own files, by path. Never `git add -A` or `git commit -a`. Reason: they sweep in other agents' work.
- Before a change that rewrites many notes, tar a backup into `.backup/` and ask the owner to pause other agents.

## Use the `brain` command, do not read every file

Reason: `brain` answers from the index with titles and descriptions, which costs far fewer tokens than opening notes. `brain help` lists every command.

| To | Run |
| --- | --- |
| Search | `brain find "words" --json` (add `--type`, `--tag`, `--area`, `--limit`) |
| List by label | `brain list --type Project --json` |
| Read one note and its backlinks | `brain show "<title or path>" --json` |
| See an area | `brain area <slug> --json` |
| Today and this week | `brain today --json`, `brain weekly --json` |
| Save a thought | `brain add "text" --tag <tag>` |
| Make a note from a template | `brain new Project "Title" -d "…"` |
| File sorted captures | `brain absorb --json` (plan), `brain absorb <capture> --into <note>` |
| To-dos | `brain todos --json`, `brain done "words"` |
| Log what you did | `brain log "text"` |
| Check your work | `brain check` (must pass before you finish) |

## Words the owner sees

Use only these words with the owner, and in any screen, menu or skill text: **add, done, move, drop, find, to-do, note, subject, sort, inbox, When, About what.**

- Never say absorb, triage, loop or outcome to the owner. They are code words. You may still run the commands.
- When you sort, ask **When?** (Today, a date, Someday, Waiting on someone, Not a to-do) and **About what?** The tokens each answer writes are in [notes.md](.claude/rules/notes.md).

The intent for every part of the brain is in the brain engine, in `docs/intent/README.md`.

## Intake

To run the intake, follow [the intake skill](.claude/skills/intake/SKILL.md) and its [stages](.claude/skills/intake/stages.md). If the owner mentions thoughts of suicide or self-harm, stop and respond with care, and share a local crisis line (988 in Canada and the US, call or text).
