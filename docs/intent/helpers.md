# Intent: Helpers

**Intent:** sorting happens so the owner never has to, and they can always see what moved and fix it.

## Problem

- Sorting by hand is a chore the owner will not keep up.
- If things are filed out of sight, they cannot trust the brain.
- They need to know which text they wrote and which a helper wrote.

## Outcomes

1. A quick to-do or capture is sorted within minutes, with no AI: rules first, then fuzzy matching, then embeddings.
2. A journal entry or rant is split into bits in a Claude chat the owner starts. Each bit goes to the right place: a to-do, a fact, a feeling, or a decision bucket. A feeling keeps what it is about as `· about <their words>`.
3. Leftovers are rare. They show as an "Unsorted entries" banner, never a pile.
4. After a sort, the owner sees which subject each line went to, with Move and Undo.
5. There is no Sort screen. To fix a line, the owner moves it or changes its tag where it lives.
6. A line the sort was unsure of carries `· check` on the line.
7. The sort learns from the owner's moves. It never asks them to rate it.
8. Every line a helper writes is marked, and the owner can see when and from what.
9. With no helper running, everything still works. Entries wait, and the owner can sort by hand.
10. A capture is deleted once it is sorted. Git history keeps it. This holds for a helper's sort and for the owner's own sort at add, by a tag, person or relation.
11. A file the owner adds keeps the ways they ticked as `asks` on its note: `split`, `enrich`, `intake`. A helper does each one and takes it out of `asks`. The file page shows a working row for each ask still there.
12. While no AI runs on the home server, the asks wait for a Claude chat the owner starts. Once Ollama runs, `brain serve` works through them on its own.

## User

The owner, a moment after they add something, and when they tap the "Unsorted entries" banner.

## Constraints

- Local and free. No paid AI.
- No background Claude runs. Claude works only in a chat the owner starts.
- Ollama on the home server takes over AI sorting once it runs. Until then, journal entries and rants wait for a Claude chat.
- The sort runs on the home server, inside the brain server.
- Never invent a fact. When unsure, file to the best guess and add `· check` to the line.
- Never decide for the owner, diagnose them, or label them or their mood.
- Never delete a note. Move it to `.archive/`. A sorted capture is not a note: once its text is in its subject, delete it.
- Never edit `sources/`.
- Never speak first. The owner starts every talk.
- Every helper write carries `generated`. Only the owner adds `verified`.
- Each sort writes one log entry listing what went where, so undo works.
- A file's to-dos and notes link back to the file note. Its intake questions go in a `# Intake` list on the file note.
- The app never says work is moving when it waits for a helper.
- `AGENTS.md` and `.claude/rules/` must match this file.
