# Intent: To-dos

**Intent:** show the owner what they have to do. It opens first, on Today, and answers "what now?" in 5 seconds.

## Problem

- To-dos with no date show as due today, so the list cannot be trusted.
- Focusing on one client or project takes too many steps.
- A done to-do often leads to the next one, and that link gets lost.

## Outcomes

1. The app opens on To-dos, on the Today view: overdue and due today.
2. Every to-do in Today has a real due date of today or earlier.
3. Standard views: Today, Soon, No date, On hold, By goal, All.
4. The owner can save their own views, for example one client.
5. One view shows at a time. Switching is one tap.
6. Ticking a to-do takes it off To-dos. It becomes a done line on its subject's timeline. It offers an optional note and one optional follow-up.
7. A to-do can point up to a goal. Date, people and subject are all optional.
8. If a rare entry is left unsorted, an "Unsorted entries" banner shows. Tapping it opens the Sort screen.

## User

The owner, first thing in the day, or when they switch to work on one client.

## Constraints

- Today is a view of To-dos, not its own tab.
- Someday to-dos show under No date.
- Waiting on someone is a status (On hold), not a When answer.
- Tap a row: open its note. Tap the tick box: done. Long-press: the menu.
- One menu everywhere: About what? first, When? below (Today, Tomorrow, Weekend, Next week, Someday, a date), Moves me toward (a goal), and a Waiting on someone switch.
- Undo is always offered after done.
- Search lives only in Find.
- To-do lines live under `# To-dos` in the most specific note. To-dos with no subject go to General, `areas/general.md` (see [add.md](add.md)).
- One shared to-do line module reads and writes these lines everywhere. See [system.md](system.md).
- A goal link is the token `· toward [Goal](../goals/<slug>.md)`.
- Today reads `due` only. A `· today` token without `due` does not count.

## Open questions

1. How the owner makes and edits a saved view.
