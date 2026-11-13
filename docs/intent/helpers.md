# Intent: Helpers

**Intent:** sorting happens so the owner never has to, and they can always see what moved and fix it.

## Problem

- Sorting by hand is a chore the owner will not keep up.
- If things are filed out of sight, they cannot trust the brain.
- They need to know which text they wrote and which a helper wrote.

## Outcomes

1. A quick to-do or capture is sorted within minutes, with no AI: rules first, then fuzzy matching, then embeddings.
2. A journal entry or rant is split into bits in a Claude chat the owner starts. Each bit goes to the right place: a to-do, a fact, a feeling, or a decision bucket.
3. Leftovers are rare. They show as an "Unsorted entries" banner, never a pile.
4. The Sort screen groups lines by subject.
5. On the Sort screen, the owner drags a line to move it. They tap a tag to change it, or + to add one.
6. A line the sort was unsure of carries a "check" tag.
7. The sort learns from the owner's moves. It never asks them to rate it.
8. Every line a helper writes is marked, and the owner can see when and from what.
9. With no helper running, everything still works. Entries wait, and the owner can sort by hand.

## User

The owner, a moment after they add something, and when they tap the "Unsorted entries" banner.

## Constraints

- Local and free. No paid AI.
- No background Claude runs. Claude works only in a chat the owner starts.
- Ollama on the home server takes over AI sorting once it runs. Until then, journal entries and rants wait for a Claude chat.
- The sort runs on the home server, inside the brain server.
- Never invent a fact. When unsure, file to the best guess and add the "check" tag.
- Never decide for the owner, diagnose them, or label them or their mood.
- Never delete a note. Move it to `.archive/`.
- Never edit `sources/`.
- Never speak first. The owner starts every talk.
- Every helper write carries `generated`. Only the owner adds `verified`.
- Each sort writes one log entry listing what went where, so undo works.
- `AGENTS.md` and `.claude/rules/` must match this file.
