---
name: fix-bug
description: Fixes a bug in brain-engine from a report or a symptom, test first, then sweeps for the same bug in similar actions. Use when the owner reports something broken, pastes an error or a bug report, or asks to check that similar actions work too.
---

# Fix a bug

A bug is fixed when a test fails before the fix, passes after, and every action with the same shape is checked.

## Steps

1. Restate the bug in one line: what the owner did, what happened, what should happen.
2. Find the cause in code. Use fallow `trace_error` for a stack trace, `trace_file` and `trace_export` to follow the call. Name the file and line.
3. Read the owner's evidence only as much as needed. Logs in the brain folder (`.log.jsonl`) are read-only from here. Never edit a brain folder.
4. Write the failing test first, in the package that owns the cause. Follow the `write-tests` skill. Run it and see it fail for the reported reason.
5. Fix the cause, not the symptom. If the fix changes what a route or MCP tool takes or returns, update `routes/table.ts`, the MCP inputs and the snapshot on purpose.
6. Run the test. It passes.
7. Sweep: list every action with the same shape (routes, sheets or flows built the same way). Check each one has a test for this case. Add the missing ones.
8. Run `npm run gates`.
9. If the server code changed, tell the owner to restart it: `launchctl kickstart -k gui/$(id -u)/com.brain.serve`.
10. Report: the cause in one line, the fix in one line, the sweep as a short list (checked, added a test, or also broken and fixed).

## Rules

- Never "fix" a test to make it pass. Never delete or weaken an assertion.
- An error the owner sees must say what to do in plain words, not a code name.
- Data loss bugs: say how to get the data back before you fix anything.
- A failing gate in a file you did not touch is another agent's work. Say so in one line.
- Commit by path. One commit for the fix and its test, one for the sweep.

## Before you stop

- [ ] A test failed before the fix and passes now.
- [ ] The sweep list is written, with a test per similar action.
- [ ] `npm run gates` exits 0.
- [ ] The owner knows if a restart is needed.
