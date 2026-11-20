---
name: handoff
description: Reads or writes docs/plan/handoff.md in brain-engine. Use when the owner asks what is next, for a status update or what needs their approval, or to finish up and write a handoff, and at the end of a long session or before context runs out.
---

# Handoff

`docs/plan/handoff.md` lists only work still to do. It is the one plan doc.

## Read it (status or next steps)

1. Read the handoff, then `git log --oneline -15` and `git status --short`.
2. Check each open row against the code. A row that is done in code is done.
3. Reply in three short groups:
   - **Done since last time**: one line each.
   - **Needs you**: approvals, things to look at on the phone, commands only the owner runs (deploy, push, `rm`, restart). Lettered, so the owner can answer by letter.
   - **Next, in order**: the open rows by what unblocks the most. Size and the model to use (Small and Medium on Sonnet, Large on Opus at medium effort).
4. Flag any row that looks like it needs re-work, in one line with the reason.

## Write it (end of work)

1. Finish or stop the work in hand. Do not start new work.
2. Commit what is done, by path. List anything uncommitted and why.
3. Update the handoff:
   - Remove done rows. Git keeps the history.
   - Add new open work as rows: task, size, what it needs, notes in one or two lines.
   - No past decisions, no story of the session, no "we tried". Only what to do and what the next agent must know to do it.
   - The "For the owner" table holds what only the owner can do.
4. Change the date at the top.
5. Tidy the space: no stray mock files, no scratch files in the repo, no leftover worktrees you made.
6. Reply with what is done, what is in the handoff, and what needs the owner.

## Rules

- Plain words, one idea per sentence, owner words only, Canadian English, no em dashes.
- Link to the intent or spec doc instead of copying it.
- Keep the file short. If a row needs more than two lines, the detail belongs in a spec under `docs/design/`.
