# Intent: Goals

**Intent:** big, inspiring aims that the owner moves toward over months or years, with progress they can see at a glance.

## Problem

- Big aims, like getting jacked, have no home in the brain.
- Small to-dos feel random when they do not point at anything bigger.
- Progress is hard to feel without clear numbers.

## Outcomes

1. Each goal leads with its data: a big percent, a thick bar, the next step, and recent movement such as "+2 this month".
2. A goal holds a ladder of targets, for example "Bench 185 lb", "Bench 205 lb", "Bench 225 lb". Each is crossed off, with a date, when hit.
3. Progress comes from targets and steps the owner crosses off.
4. A goal can have subgoals, one level deep. A goal with a `parent` is a subgoal. Its progress counts toward the parent bar.
5. Any to-do or project can point at a goal. Its steps then count toward it.
6. A done step toward a goal is a Win. Wins show on the goal.
7. A goal relates to topics, people, groups and other notes, like any note.
8. Decisions related to a goal show under that goal on the Goals tab.
9. When the owner adds a to-do, the brain suggests a goal from its subject.

## User

The owner, when they feel flat or stuck and wants to see why the small things matter. Also when they hit a target.

## Constraints

- Goals are a tab of their own.
- A goal page has its own layout, not the subject page layout.
- A goal belongs to 1 or more life areas. Its colour is the mix of their key colours.
- No live data feeds and no dashboard of outside data. An import now and then can cross off targets, with the owner's yes.
- A goal is not a project. A project ends when the work is done. A goal can have no end.
- A goal never shows on Today. Today holds real dates only.
- Type **Goal** in `goals/`, one note per goal. Made with the Goal builder on +.
- Fields: `title`, `description`, `why`, `when` (loose, optional), `status` (active, later, done), `areas` (1 or more), `parent` (optional; set means subgoal).
- Body: `# Why`, `# Targets` (checklist lines), `# Wins`, `# Notes`, plus relation sections like any note (`# People`, `# Groups`, `# Topics`, `# Related`).
- A helper may suggest goals from the Future lens. The owner approves each one.
- Everything on a goal is computed on read. Nothing below is written into a note.
- Percent is done over total, across the `# Targets` checklist lines plus the steps, plus the same for its subgoals (one level). Each to-do counts once. Dropped lines do not count.
- A step is a to-do in the goal's own `# To-dos`, a to-do anywhere with `· toward` this goal, or a to-do in a Project linked to this goal in either direction.
- A Win is a done target or a done `· toward` to-do, dated by its `done` token.
- "+N this month" counts targets and steps done in the last 30 days.
- The next step is the open to-do with the soonest due date, else the first open target.
