---
name: sort
description: Splits waiting journal notes into bits (to-dos, facts, feelings, decision bits) and files each bit in its subject, with the owner's yes. Use when the owner says "sort my journal", "split my entries", "sort", or asks what is waiting.
---

# /sort

This skill splits journal notes that wait for a chat. Quick to-dos and captures are sorted by the brain on its own. Leave them alone. Read `.claude/rules/notes.md` first: it holds the line formats and tokens. Use only the words in `AGENTS.md`.

## 1. Find what waits

Run `brain sort --journal --json`. Each item is one journal note with `sorted: false`: its path, title, date and text.

## 2. Keep the journal whole

Each journal note keeps one entry whole. Never edit its text or its title. The brain links each bit back to it and marks it sorted.

## 3. Propose

Show one table per journal note, one row per bit:

| Bit | Kind | About what | When | Line to write |
| --- | --- | --- | --- | --- |

- **Kind:** to-do, fact, feeling, or decision bit.
- **About what:** the most specific subject. No subject: General (`areas/general.md`). A bit toward a goal gets `· toward`.
- **When:** a When token from `notes.md` for a to-do. `note` for a fact, a feeling or a decision bit.
- A feeling keeps the owner's words and adds `· about <their words>`. Never name their mood.
- Unsure: write your best guess and add `· check`.

## 4. File

After the owner says yes to all rows, or the rows they name, sort the journal note in one step:

```
brain sort journal/<file>.md --bits '[{"into":"people/sam-lee.md","when":"note","kind":"feeling","text":"…","about":"…"},{"into":"areas/general.md","when":"tomorrow","kind":"to-do","text":"…"}]'
```

Each bit gets `· from [<title>](../journal/<file>.md)`. The journal note stays and gets `sorted: <today>`. One `brain undo` takes every bit out and the note waits again.

## 5. Close

The Stop hook runs `brain check`. Fix what it reports. Then run `brain log "sorted N journal notes"`. Tell the owner in one line what went where.
