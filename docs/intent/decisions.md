# Intent: Decisions

**Intent:** take a big choice out of the owner's head, gather every thought on it in one place, and show each part of their life it touches.

## Problem

- Big choices live only in the owner's head, and several pile up at once.
- One choice touches many areas. Example: whether to change jobs, with risks to home, money and health.
- Their thoughts on a choice are scattered, so they cannot decide with all the facts.

## Outcomes

1. A clear list of open decisions that the owner can add to, edit and delete.
2. The owner can rant on a decision in long text. Each rant is kept whole and dated.
3. Useful bits from each rant are sorted into buckets, one per subject the choice touches. Each bit links back to its rant.
4. The page shows facts the brain already has that bear on the choice, with their sources.
5. When the owner decides, they write what and why. The decision then shows in the timeline of each subject it touched.

## User

The owner, when they feel overwhelmed by choices, and later when they are ready to decide.

## Constraints

- A decision page has its own layout, not the subject page layout. It shows:
  - the decide-by date,
  - each option, with its for and against,
  - bits not placed yet.
- The owner drags a bit to place it, move it, or delete it.
- Rants wait for a Claude chat to be split into bits. See [helpers.md](helpers.md).
- The helper gathers. It never scores options, decides or nudges.
- A decision is tied to a goal through a relation, the same way any note relates to another. It then shows under that goal on the Goals tab. Other decisions live in Brain.
- An optional decide-by date puts one to-do in To-dos.
- Type **Decision** in `decisions/`, one note per decision. Made with the Decision builder on +.
- Fields: `title` (the question), `description`, `status` (open, decided, dropped), `decide_by` (optional), `subjects` (links).
- Body: `# Rants`, `# Buckets` (one heading per subject), `# Options`, `# Decided`, plus relation sections like any note.
- Bits link to subjects. They are not copied into subject notes.
