# Intent: Add

**Intent:** get a thought out of the owner's head in under 10 seconds, and show them where it went.

## Problem

- A to-do in their head costs energy until it is saved.
- When they feel overwhelmed, they need to dump a lot of text, not fill in a form.
- After they save something, they do not see where it went, so it feels pointless.

## Outcomes

1. A to-do is saved in one line, in under 10 seconds, with no choice of where it goes.
2. A long journal entry can be dumped in one box. Its bits are sorted later.
3. While they type, search suggests a home and shows similar entries.
4. After every save, the owner sees which subject it joined, and can change it in one tap.
5. Bigger things start from the same place, through a step-by-step builder.
6. Adding from inside a subject or goal fills in About what? on its own.

## User

The owner, on a small screen between tasks, or on a large one mid-work. Often tired. Often has one hand free.

## Constraints

- The + sits in the middle of the tab bar on every screen. It opens over the current screen. It is never the first screen.
- + asks "What do you want to add?".
- Quick choices: **To-do** (default), **Journal**, **Intake**.
- Step-by-step builders: **Goal**, **Decision**, **Event**, **Person**, **Project**, **Place or thing**, **File**.
- About what? and When? are optional. About what? comes first.
- The owner can still link a subject by hand. A suggestion never replaces their pick.
- No title field. The first line is the title.
- No blank note editor. The owner edits entries; they do not start notes from scratch.
- No voice feature in the app. The OS provides it.
- Every to-do and journal entry added in the app waits in Unsorted first, even with a subject, tag or person picked. The owner sorts it there. Nothing is filed out of sight. See [helpers.md](helpers.md).
- A helper's add (the `add` tool) still files at once when it names a subject, tag or person.
- "Move" on the toast opens Unsorted. It never deletes the add. "Undo" is the only way to take an add back.
- Each journal entry is its own journal note, kept whole and dated. A day can have many. Its title comes from its first words, and the owner can change it. Each sorted bit links back to it.
- Journal entries wait for a Claude chat to be split into bits. See [helpers.md](helpers.md).
- An add that is cut off can be picked up where it stopped.

## Open questions

1. What a File becomes once added: which type and folder.
