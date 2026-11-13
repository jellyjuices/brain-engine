---
name: sort-inbox
description: Sorts captures in inbox/ into their subject notes (areas, projects, events, people, groups, places, things, topics, lenses) with the owner's approval, then archives them. Use when the owner says "sort my inbox", "file my notes", "triage", "clean up the inbox", or "what's in my inbox", also when they do not say "sort".
---

# /sort-inbox

This skill files captures. It writes only what the owner approves in the table. Read `.claude/rules/notes.md` first: it holds the line formats and When tokens. Use the words in `AGENTS.md` ("Words the owner sees").

## 1. Get the plan

Run `brain absorb --json`. Do not read the files in `inbox/` one by one. Reason: the plan already holds each capture's text and its best match.

For a capture with no clear match, run `brain find "words" --json --limit 5`.

## 2. Propose

Show one table, with one row per capture:

| Capture | When | About what | Line to write |
| --- | --- | --- | --- |

- **When:** Today, a date, Someday, Waiting on someone, or Not a to-do. Write the tokens from the When table in `notes.md`.
- **About what:** the most specific subject. An event comes first, then a group, thing or project, then an area. Never file a to-do under a person just because it names them. If the only subject is the people it names, leave it in the inbox as its own capture and ask the owner.
- A to-do becomes a line with its When tokens, for example `- [ ] Text · due YYYY-MM-DD` for a date. If it names a person, add `· with [Name](...)`.
- "Not a to-do" becomes a dated note line: `- YYYY-MM-DD · Text.`
- If the owner wants to drop a capture, archive it with no line.
- **A subject named for the second time gets its own note.** Pick the type with "Who, where, doing, have, or know?" (rules in `notes.md`). Propose each new note as its own row. Link it from the area's `# See also`, and add a relation line with a role only if the owner said one.
- A fact about the owner that you are not sure of stays in `inbox/` with a question.
- Every to-do stays in the brain. When a client keeps tasks in their own tool, add the link to the client's task on the line. Never copy a task into another tool.

## 3. File

After the owner approves all rows, or the rows they name:

- First, run `brain new <Type> "Title" -d "…"` for each new note.
- Then run `brain absorb <capture> --into <note>` for each approved row. Edit the line afterward if it needs `· with`, or a When token that `absorb` did not set.

## 4. Close

Run `brain check`. Fix what it reports, then run it again. Continue only when it passes. Then run `brain log "sorted inbox: N filed"`. Tell the owner in one line what went where.
