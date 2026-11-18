# Rules for AI helpers in this folder

This folder is the owner's second brain: plain Markdown notes. Any AI helper (Claude, ChatGPT, Gemini) follows these rules.

Talk to the owner in plain, simple words, one idea per sentence, active voice. No em dashes.

## Rules by area

Read the file for the area you work in. Claude Code loads it on its own.

| Area | File |
| --- | --- |
| Writing notes, to-dos, feelings, relations, When tokens | [notes.md](.claude/rules/notes.md) |
| Lens or area for a fact about the owner | [lenses.md](.claude/rules/lenses.md) |

## Folders

`ls` shows the layout. It does not show:

- `areas/general.md` (General) holds to-dos with no subject.
- `goals/` holds one Goal note per big aim. `decisions/` holds one Decision note per big choice.
- `journal/` holds one Journal note per journal entry, kept whole and dated. A day can have many. Sorted bits link back to it.
- `inbox/` holds captures that wait for a helper. The owner never sorts it. Once sorted, a capture is deleted. Git keeps it.
- `events/` holds one dated visit, appointment or meeting each, with `date`, `status` (upcoming, done, cancelled) and `with`.
- `me/` holds one Lens note per lens. `sources/` is raw material, such as the owner's full intake answers.
- Hidden: `.archive/` (finished notes, still searchable), `.templates/`, `.schema/` (types, tags, lens names), `.reports/` and `.brain/` (made by `brain`), `.log.jsonl` (read with the `log` tool).

## Trust labels

- When you write or change a note, set `generated: {by: <your name>, at: <ISO time>}`. Leave it off notes the owner writes.
- Only the owner adds `verified`, after they check a helper's note.
- When you are unsure where a line goes, file it to your best guess and add `· check`.

## Hard rules

- **Never delete a note.** Move it to `.archive/`. A sorted capture is the one exception. Reason: backlinks and the log still point to notes.
- **Never edit files in `sources/`.** The one writer is `brain intake save --raw`. To redact, run `brain intake redact "words"`.
- **Never invent facts about the owner.** Never diagnose them or label their mood.
- **Never deploy.** A deploy is public. The owner does it.
- **The brain is the one home for to-dos.** When a client keeps tasks in their own tool, link to the client's task. Do not copy it.

`.claude/settings.json` blocks edits to `sources/`, `rm` and deploys. Do not weaken that.

## Working alongside other agents

- **Re-read a file right before you write it.** Reason: a copy you read earlier undoes their work.
- Stage only your own files, by path. Never `git add -A`, `git commit -a`, stash, reset or check out over others' files. The daily job's commit is the one exception.
- Before a change that rewrites many notes, commit first and ask the owner to pause other agents. Git is the backup.

## Reading and writing the brain

Use the brain's MCP tools. They answer from the index, which costs far fewer tokens than opening notes. Every write is logged, re-indexed and checked.

| To | Tool |
| --- | --- |
| Find | `find` |
| Read one note and its backlinks | `read_note` |
| Today, or any to-do view | `today`, `todos` |
| Add | `add` |
| Tick, move or delete a to-do | `done`, `move`, `delete_todo` |
| Change a to-do's words | `edit_todo` |
| Move a repeating to-do to its next date, not done | `skip` |
| Make a note from a template | `make_note` |
| Put back the last change | `undo`, after `log` |
| Sort what waits | `unsorted`, then `sort` |

If the tools are not there, read the notes as files and edit them by the rules in [notes.md](.claude/rules/notes.md). Then run `brain check`. It must pass before you finish.

The `brain` command is for upkeep and intake only: `brain index`, `brain check`, `brain intake ...`, `brain thread ...`. `brain help` lists them.

## Words the owner sees

Use only these words with the owner: **add, done, move, delete, find, to-do, note, subject, goal, decision, sort, view, journal, intake, When, About what.** Never say absorb, triage, loop, outcome, drop, park or schedule. You may still run commands that use them.

When you sort, ask **About what?** first, then **When?**. The tokens each answer writes are in [notes.md](.claude/rules/notes.md).

## Intake

Follow [the intake skill](.claude/skills/intake/SKILL.md). If the owner mentions thoughts of suicide or self-harm, stop and respond with care, and share a local crisis line (988 in Canada and the US, call or text).
