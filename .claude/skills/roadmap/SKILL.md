---
name: roadmap
description: Reads or updates docs/plan/roadmap.md in brain-engine, the one plan doc. Use when the owner asks what is next, for status, what needs their approval, to plan or brief work for subagents, or to wrap up a session, and at the end of a long session or before context runs out.
---

# Roadmap

`docs/plan/roadmap.md` is the one plan doc. It lists only work still to do, in tracks. Each track has an intent, a "Done when" list, limits, what is built now, and steps.

## Read it (status or next steps)

1. Read the roadmap, then `git log --oneline -15` and `git status --short`.
2. Check each open step and each "Done when" line against the code. A line that is true in code is done.
3. Reply in three short groups:
   - **Done since last time**: one line each.
   - **Needs you**: the "For the owner" rows, things to look at on a small screen, commands only the owner runs (deploy, push, `rm`, restart). Lettered, so the owner can answer by letter.
   - **Next, in order**: open steps by what unblocks the most, with size and model (Small and Medium on Sonnet, Large on Opus at medium effort).
4. Flag any step that looks like it needs re-work, in one line with the reason.

## Brief a subagent from it

1. Give the agent the step, the track's intent and its "Done when" lines, word for word.
2. Name the files it owns. Two agents never own the same file.
3. When it reports back, give the reviewer agent the same "Done when" lines to check.

## Update it (end of work)

1. Finish or stop the work in hand. Do not start new work.
2. Commit what is done, by path. List anything uncommitted and why.
3. Update the roadmap:
   - Remove done steps. When every "Done when" line in a track is true, delete the track.
   - Add new open work as a step in the right track: task, size, what it needs.
   - A new track needs an intent with a link, "Done when" lines a reviewer can check, limits, now and steps.
   - No past decisions, no story of the session, no "we tried".
   - The "For the owner" table holds what only the owner can do or decide.
4. Change the date at the top.
5. Tidy the space: no stray mock files, no scratch files in the repo, no leftover worktrees you made.
6. Reply with what is done, what is in the roadmap, and what needs the owner.

## Rules

- Plain words, one idea per sentence, owner words only, Canadian English, no em dashes.
- Each "Done when" line is one check that is true or false. Not "looks good".
- Link to the intent or spec doc instead of copying it.
- Keep the file short. If a step needs more than two lines, the detail belongs in a spec under `docs/design/`.
