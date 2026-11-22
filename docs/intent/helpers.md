# Intent: Helpers

**Intent:** sorting takes one tap. The brain suggests where each add goes, nothing files itself, and the owner can always see what moved and fix it.

## Problem

- Sorting by hand is a chore the owner will not keep up.
- If things are filed out of sight, they cannot trust the brain.
- They need to know which text they wrote and which a helper wrote.

## Outcomes

1. While the owner types a to-do, the brain suggests subjects, with no AI: rules first, then fuzzy matching, then embeddings. A tap on a suggestion files it there. A guess never files itself, however sure it is. An add with no tap waits in Unsorted, with its best guess shown, until the owner taps.
2. A journal entry or rant is split into bits in a Claude chat the owner starts. Each bit goes to the right place: a to-do, a fact, a feeling, or a decision bucket. A feeling keeps what it is about as `· about <their words>`.
3. Adds that wait show as an "Unsorted entries" banner, never a pile. Each row shows its guess, and one tap files it.
4. After a sort, the owner sees which subject each line went to, with Move and Undo.
5. There is no Sort screen. To fix a line, the owner moves it or changes its tag where it lives.
6. A line the sort was unsure of carries `· check` on the line.
7. The sort learns from the owner's moves. It never asks them to rate it.
8. Every line a helper writes is marked, and the owner can see when and from what.
9. With no helper running, everything still works. Entries wait, and the owner can sort by hand.
10. A capture is deleted once it is sorted. Git history keeps it. This holds for a helper's sort and for the owner's own sort at add, by a tag, person or relation.
11. A file the owner adds keeps the ways they ticked as `asks` on its note: `split`, `enrich`, `intake`. A helper does each one and takes it out of `asks`. The file page shows a working row for each ask still there.
12. With no local model set up, the asks wait for a Claude chat the owner starts, or for the owner. With the local model add-on on, `brain serve` works through them on its own.

## User

The owner, a moment after they add something, and when they tap the "Unsorted entries" banner.

## Constraints

- Local and free. No paid AI.
- No background Claude runs. Claude works only in a chat the owner starts.
- A local model is an add-on, never a need. When the owner turns it on, it helps sort journal entries and rants. When it is off, they wait for a Claude chat or the owner.
- The sort runs on the home server, inside the brain server.
- Never invent a fact. When unsure, file to the best guess and add `· check` to the line.
- Never decide for the owner, diagnose them, or label them or their mood.
- Never delete a note. Move it to `.archive/`. A sorted capture is not a note: once its text is in its subject, delete it.
- Never edit `sources/`.
- Never speak first. The owner starts every talk.
- Every helper write carries `generated`. Only the owner adds `verified`.
- Each sort writes one log entry listing what went where, so undo works. A sort's lines and the delete of the capture are that one entry.
- A subject matches a text when its title, its first name (people) or one of its `aliases` shows in the text as whole words. The most specific type wins: event, person, group, place, thing, topic, project, then area. Other named people become `· with`, other named subjects `· re`.
- `brain add` files straight into a subject only with a When prefix and a match. With no prefix, "to-do or fact?" is a guess, so it goes to the inbox with the best match shown.
- Any one pick by the owner at add (About what?, a person or a tag) counts as sorted. The text goes straight to that subject and no capture is written. A tag goes to the area note with that slug or tag. A tag that is not an area goes to General.
- A journal note keeps `sorted: false` in its frontmatter while it waits. A sort sets `sorted: <date>` and never changes the body. The slug comes from the title once. Links use the path, so they hold when the owner edits `title`.
- A name with no note that shows in 2 or more subject notes gets one offer: "X came up again. Make a note?" Sort and intake make it, and never twice in one session.
- `brain check` warns, and never rejects, when a filed note spells out a subject's title without linking it. A name of 1 to 3 capitalised words with no note also warns. Single words at the start of a sentence are skipped. A note that already links to a subject once is not warned about plain mentions of it. Each warning list stops at a fixed number of lines, so a big brain does not drown the owner.
- A file's to-dos and notes link back to the file note. Its intake questions go in a `# Intake` list on the file note.
- The app never says work is moving when it waits for a helper.
- `AGENTS.md` and `.claude/rules/` must match this file.
