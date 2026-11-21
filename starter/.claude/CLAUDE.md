# Claude Code

The rules for this folder are in AGENTS.md, imported below. This file adds Claude Code workflow only.

@../AGENTS.md

## Skills and subagents

- Intake: run the `intake` skill. Splitting waiting journal entries: `sort`.
- For wide questions across many notes, use the `brain-search` subagent. It returns paths and one-line answers, so the main chat stays small.
- Rule files in `.claude/rules/` load on their own when you touch their paths. A skill that writes notes reads `notes.md` first.
- The `brain` code lives in the brain engine, not here. Change code there.

## Small outputs only

Reason: big tool output stays in the chat and is read again on every call.

- Never `cat` many files at once. Read one file, and use `offset` and `limit` for files over 200 lines.
- Every `grep` names a path and ends in `| head -30`. Use `grep -l` or `grep -c` first to see how many hits there are.
- Aim for under 4 KB per tool result. If one comes back bigger, narrow the next one.

## Hooks

- After you edit a Markdown file, a hook runs `brain index`. Do not run it yourself after each edit.
- When you stop, a hook runs `brain check`. If it fails, fix what it reports. Do not work around the hook. If a stop was already forced once by the hook, the next stop goes through, so it never loops.
