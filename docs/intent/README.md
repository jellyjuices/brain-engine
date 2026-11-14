# Intent: Brain

**Intent:** the owner never holds a thing in their head just so they do not forget it. They put things in, in their own words. The brain puts them where they belong. When they need to act or decide, everything they know about the subject is in one place.

This folder is the one source for what the brain is. Design, docs and code start here. When another file disagrees, this folder wins and the other file is fixed.

## Problem

- Thoughts, to-dos and decisions live in the owner's head. That costs energy they do not have on many days.
- When they put something in, they do not see where it went or how it helps. It feels like a void.
- A big choice touches many parts of their life, but no single place holds all their thoughts on it.
- Big aims have no home, so small steps feel random.
- Their life is chaotic. Any tool that needs a fixed habit fails them.

## Aims

The brain is working when:

1. A to-do is saved in under 10 seconds, on the phone or the laptop, with no choice of where it goes.
2. Every add shows where it went. Every view gives something back.
3. Each subject has one full view: to-dos, facts, people, feelings and a timeline.
4. A big choice has one page that holds every thought on it.
5. Each goal shows how far along it is, from targets and steps the owner crosses off.
6. The owner can tell what they wrote, what a helper wrote, and what they checked.
7. Nothing breaks when they skip a day or a month.
8. Upkeep is near zero: plain files, nothing paid, no manual sync.
9. **Progressive disclosure.** The surface stays simple. When the owner needs more, they drill down into a subject for more metrics and detail, all the way to the source files.

## User

One person: the owner. They are the only user. Design for a busy person with low energy on many days, for whom long screen time is hard. They use the phone app most, then the laptop. They add from + in a few ways: a quick to-do, a journal entry, an intake, or a step-by-step builder. They do not write notes from scratch.

## Areas

The tab bar is **To-dos · Goals · + · Find · Brain**.

| Area | Intent | File |
| --- | --- | --- |
| Add | Get a thought out of their head in seconds, and show where it went | [add.md](add.md) |
| To-dos | What to do now; opens on Today, real dates only | [to-dos.md](to-dos.md) |
| Goals | Big aims with a clear percent, moved forward one step at a time | [goals.md](goals.md) |
| Decisions | One page per big choice, with every thought placed | [decisions.md](decisions.md) |
| Find | Get anything back in seconds, by words or a question | [find.md](find.md) |
| Brain | Browse subjects, and deep dive on one when they need to | [brain.md](brain.md) |
| Connections | A visual web of how any item links to others | [connections.md](connections.md) |
| Me and intake | The brain learns who the owner is: enrich what it knows, or collect new information | [me-and-intake.md](me-and-intake.md) |
| Helpers | Sorting happens for the owner, and they can see and fix it | [helpers.md](helpers.md) |
| Settings | Status: what works now, what has not synced, storage | [settings.md](settings.md) |
| System | Where the brain runs and how its parts fit | [system.md](system.md) |

## Constraints

### Experience

1. **Simple beats clever.** One way to do each thing. If it gets convoluted, the owner stops using it.
2. **Show where it went.** After any add or sort, name the subject and offer a fix.
3. **No inbox screen.** Sorting happens for the owner. A rare leftover shows as an "Unsorted entries" banner.
4. **Interrupted flows resume.** The owner can pick up any add, sort or builder where they left it.
5. **Only real dates on Today.** A to-do with no date never shows as due.
6. **Only the words are required.** Date, subject, people and goal are optional on a to-do.
7. **No set habit.** No daily sort, no weekly or scheduled review, no streaks. Look-back is on demand.
8. **Calm on the eyes.** Quiet UI. Colour only where it carries meaning.

### Look

- Mobile first. The phone is the main screen; larger screens adapt from it.
- Sea Glass: dark first, a seafoam accent, light noise, a corner glow, soft flat shapes.
- Fonts: Hedvig Letters Serif for titles, Atkinson Hyperlegible Next for body and UI, Space Mono for numbers.
- Each life area has a key colour. An item in several areas shows a mix of their colours.
- Text always stays neutral. Colour sits on dots, bars and shapes, never on words.
- The design system lives in `design-system/` in the engine.

### Words the owner sees

add, done, move, delete, find, to-do, note, subject, goal, decision, sort, view, journal, intake, When, About what.

Never absorb, triage, loop or outcome.

### System

| Decision | Reason |
| --- | --- |
| Markdown files are the source of truth. The index and reports are caches. | Plain text outlives any app. |
| OKF-style frontmatter. `type` required. `generated` on helper writes; only the owner adds `verified`. | The owner sees what a helper wrote. |
| One file per subject. Two folder levels at most. | The owner finds things by name. |
| A note (subject, project, goal, decision) belongs to 1 to 3 life areas, such as Health or Career. | Much of life spans more than one area. |
| The 12 types in `.schema/types.yaml`, plus Goal (`goals/`) and Decision (`decisions/`). | Goals and choices need their own home. |
| The brain holds every to-do. A client's own task tool gets a link, never a copy. | Two task homes drift. |
| Local and free. No paid AI. | No bill and no service can lock the owner out. |
| No live links to outside apps. A data import now and then is fine. | The owner is not tied to one app. |
| Voice comes from the phone keyboard or the OS. | Nothing to build or keep up. |
| Git history is the backup of the notes, private and local. The notes have no remote. | Any change can be undone, and the notes never leave the server. |

Where it runs: [system.md](system.md).

## Open questions

1. Outside material, such as workbooks the owner adds, may shape the intake. Which exercises map to which lenses?
