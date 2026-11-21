# Intent: Me and intake

**Intent:** the brain learns who the owner is, in their own words, and uses it to make every other part fit them. Each intake either enriches what the brain already knows or collects new information.

## Problem

- The brain cannot help well if it does not know the owner's values, limits and aims.
- The owner will not write about themselves from scratch, but they will answer good questions.
- Some of what the owner knows about themselves sits in outside material, like workbooks or old journals.

## Outcomes

1. The owner can start an intake any time. Intake is its own choice on +.
2. The intake asks one question at a time and ends at once on the stop word.
3. An intake that is cut off picks up where it stopped.
4. Each answer lands where it belongs: a fact about the owner in a lens, a fact about a subject in that subject, a to-do in To-dos, a goal idea in Goals for their yes.
5. Each lens shows what the owner said, newest first, with the date and a link to the raw talk.
6. The owner can add new material, like a workbook, and the brain learns from it.
7. Goals and decisions use what the brain knows about them.

## User

The owner, when they have the energy to reflect. Never on a schedule.

## Constraints

- Lenses: now, day, people, values, wellbeing, story, identity, future, profile. One note each in `me/`.
- Lens writes apply the privacy level in `me/settings.yaml`.
- Raw talks live in `sources/intake/` and are never edited.
- Never diagnose, label or explain the owner to themselves. Record only links they make.
- A lens is about who the owner is and how they feel. An area is about what they handle. Each lens says where its line with the areas sits, so one fact lives in one place.
- A lens note is made the first time the intake saves to it or sets its privacy. Until then it does not exist. Wellbeing and identity start at `headline` until the owner changes it in stage 0.
- Open threads are saved questions for a later chat. They live as checklist lines under `# Open threads` in their lens note, not as files: `- [ ] What made weeks feel lighter in the past? · ★ · depth 2 · 2026-11-04`, or `- [x] … · talked · 2026-11-04` once talked.
- An intake session is a file in `.reports/` (git ignores it). Every `brain intake …` call, including a non-TTY agent run, shares it: who was asked, who was offered a note, and what got written.
- A subject gets its note when the owner answers, because it then has its own facts. A skipped question writes nothing.
- Every edit to an existing note goes through one logged change, so `brain undo` reverses it. A new note is not undone by `brain undo`: the summary says to move it to `.archive/`.
- Taking something back is the one place intake removes text. It removes every intake line, quote and thread that holds the words, and blanks the matching raw answers in `sources/intake/`.
- No daily prompts or nags.
- Feelings about the owner themselves go in a lens.
- A feeling that names a subject goes in that subject only, in the owner's phrases, grouped by what it is about (see [brain.md](brain.md)).
- If the owner mentions self-harm, stop and share 9-8-8.

## Open questions

1. Which workbook exercises map to which lenses, once the owner adds them?
