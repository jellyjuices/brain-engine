---
name: sort
description: Splits waiting journal entries into bits (to-dos, facts, feelings, decision bits) and files each bit in its subject, with the owner's yes. Use when the owner says "sort my journal", "split my entries", "sort", or asks what is waiting.
---

# /sort

This skill splits journal entries that wait for a chat. Quick to-dos and captures are sorted by the brain on its own. Leave them alone. Read `.claude/rules/notes.md` first: it holds the line formats and tokens. Use only the words in `AGENTS.md`.

## 1. Find what waits

Run `brain list --type Capture --json`. A waiting journal entry is a longer capture with more than one thought. Skip one-line captures.

## 2. Keep the entry whole

Each entry lives whole in the day note, `journal/YYYY-MM-DD.md`, under its time. If the day note is missing, make it with `brain new Daily "YYYY-MM-DD" -d "Journal for YYYY-MM-DD"`.

## 3. Propose

Show one table per entry, one row per bit:

| Bit | Kind | About what | When | Line to write |
| --- | --- | --- | --- | --- |

- **Kind:** to-do, fact, feeling, or decision bit.
- **About what:** the most specific subject. No subject: General (`areas/general.md`). A bit toward a goal gets `· toward`.
- **When:** for a to-do only. Use the When tokens in `notes.md`.
- A feeling keeps the owner's words and adds `· about <their words>`. Never name their mood.
- Each line links back to the day note.
- Unsure: write your best guess and add `· check`.

## 4. File

After the owner says yes to all rows, or the rows they name, write each line in its subject. Then file the capture into the day note with `brain sort <capture> --into journal/YYYY-MM-DD.md`. A sorted capture is deleted. Git keeps it.

## 5. Close

The Stop hook runs `brain check`. Fix what it reports. Then run `brain log "sorted N journal entries"`. Tell the owner in one line what went where.
