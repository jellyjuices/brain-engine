# Concept A: The list

Nov 13, 2026 · design v2, revision 2 · written by Claude · wireframes: `concept-a.html` and `concept-a.png` stay in the owner's notes folder, under `.reports/design-v2-2026-11-12/`. They show real notes, so they are not in this repo.

The owner picked this concept on Nov 12. This revision applies his feedback. Concept B was not picked.

## The idea in 3 lines

To-dos are the centre. The app opens on one list, in the Today view, and every other screen feeds it or hangs off it.
+ asks "What do you want to add?". A to-do or a journal is one box. Anything else gets a step-by-step builder.
A subject opens the Page. A goal and a decision each open their own page, built for their job (the owner, fork 2).

## Navigation

Tab bar: **To-dos · Goals · + · Find · Brain**, the bar the owner named in Q7.

- **To-dos** opens first, in the Today view. Views sit in a row of text tabs above the list: Today, Soon, No date, his own views, then All views. A gear at the top right opens Settings.
- **+** opens the type picker over the current screen. Long-press + skips straight to a to-do. From inside a Page, the subject is filled in.
- **Goals** holds goals with big progress bars and their subgoals. Under each goal sit only the decisions and wins that belong to it (the owner, fork 3).
- **Find** is the only search. The owner loves it. Its type chips became smart suggestions.
- **Brain** shows open decisions that are not part of a goal, then subjects by kind, then Archive.
- Any subject opens **the Page**. Unchanged: the owner loves it. A goal opens **the goal page**, a decision **the decision page**.

## Screen inventory: 11 screens

| Id | Screen | Jobs | Why it cannot merge |
| --- | --- | --- | --- |
| A.1 | To-dos | J2, J4, J9, J11, J12, J14 | The home. Views are states of this one screen, not screens. |
| A.2 | Add (sheet) | J1, J3, J10 | Opens over any screen. Picker, to-do and journal are steps of one sheet. |
| A.3 | Sorted | J9 | A sort spans many subjects. No one Page can show it. |
| A.4 | Page | J6, J13 | One layout for every subject kind: area, project, person, group, place, thing, topic, event. |
| A.10 | Goal page | J7 | A goal is about progress: big bar, subgoals, targets, next step. The owner: goals are not subjects. |
| A.11 | Decision page | J5 | A decision is about options, bits for and against, and a decide-by date. The owner: decisions are not subjects. |
| A.5 | Goals | J7, J5 | A tab of its own, by the owner's choice. Goals and subgoals, with each goal's own decisions and wins. |
| A.6 | Find | J8 | Search lives only here. |
| A.7 | Brain | J5, J6, look back | Open decisions not part of a goal, a list of kinds, Archive. No to-dos, no search. |
| A.8 | Settings | J12 | Rare. Out of the main screens. |
| A.9 | Builder | J5, J7, adding a person, place, event, project | Full screen, step by step. Too tall for a sheet, and one flow serves every kind but to-do and journal. |

Sheets that belong to a screen: All views (A.1b), Edit view (A.1c), the row menu (long-press), the ⋯ menu on a Page.

The app today has about 13 kinds of screen. A has 11. The Page, goal page and decision page share small parts: to-do rows, timeline lines and the ⋯ menu.

Wireframes (revision 2): A.1a, A.1b, A.1c, A.1d, A.2a, A.2b, A.2c, A.2d (builder), A.3, A.4a, A.4b, A.4c, A.4d, A.5, A.6, A.W. A.4b is now the decision page and A.4c the goal page, each with its own layout. A.4a, A.4d and A.6 lost their chips (item 10). A.4a changed by one timeline line.

## What changed in revision 2

1. **A done to-do leaves To-dos.** Tick it and it goes. A toast offers Follow-up and Undo, and says where it went: the subject's timeline, plus the goal's wins only if it counts toward a goal. A Win exists only as progress on a goal (the owner, fork 9). A done to-do with no goal is just done. No view shows done to-dos. (A.1a)
2. **Views, not chips.** // DECISION: views like Google Tasks, Notion or ClickUp. Why: the owner asked for them, and a view is one whole answer, not a stack of filters to combine. (A.1a, A.1b, A.1c)
   - Standard views: Today (overdue and due today), Soon (next 7 days, by day), No date (by subject), On hold (by who he waits on), By goal, All (by subject).
   - His own views: a name, About what?, When?, Group by (When, Subject, Goal, None) and Sort by. "GCorp" is one.
   - One view at a time. Text tabs show the first few; All views lists the rest.
3. **The type picker stays,** matched to the types. (A.2a)
   - Quick: To-do, Journal, Intake. // DECISION (the owner, Nov 13): Intake keeps its own choice on +, not folded into Journal.
   - Step by step: Goal, Decision, Event, Person, Project, "Place, thing or more", and File.
   - "Talk" is now "Journal", the owner's word.
4. **Builders** for every kind but to-do and journal. One question per step, a step count on top, Back and Next, and every step but the name can be skipped. (A.2d)
   - Goal: name · why, in your words · targets · first step · part of a bigger goal? (optional; pick a parent goal, or skip).
   - Decision: the question · subjects it touches (suggested) · options · decide-by date · first journal. All but the question are optional.
   - Person: name · how you know them · key facts (birthday, partner) · groups.
   - Event: what · date · with who · prep to-dos.
   - Project: what · for whom (a subject) · first to-do.
   - Place, thing, group, topic, note: name · what it is · links.
5. **Sorting is simple: drag and tap.** No scores, no Move button. (A.3)
   - Lines are grouped by the subject each went to.
   - Drag a line by its handle onto another subject to move it. While dragging, each subject heading says "Drop here".
   - Tap a line's tag (feeling, fact, to-do, a date) to change it. Tap + on a line to add a tag.
   - A line the helper was not sure of carries a "check" tag. Dragging it or tapping its tag clears it.
   - Each drag or tag change teaches the helper where lines like it go. The Mac mini keeps every change, and the helper reads them before each sort.
   - Undo this whole sort stays at the foot.
   - Drag needs a second way for people who cannot drag: long-press a line, then Move to. That is the row menu every list already has, so it adds no new part.
6. **Goals are task forward.** (A.5, A.4c)
   - Each goal card has a big percent, a thick bar, "+2 this month", and the next step with a tick box right there.
   - The goal Page puts the big count and bar on top, then two big cards: "+2 this month" and the next target.
   - Under each goal: its subgoals, then the decisions and wins that belong to it. Decisions not part of a goal live in Brain. There is no Wins list outside a goal (the owner, fork 9). Subgoals add to the parent's bar (the owner, fork 8).
   - "Start a goal" and "Start a decision" are gone. New ones come from +, like everything else.
7. **Search while typing.** As he types a to-do, a journal or a builder step, word search runs on the device's copy. It shows: (A.2b, A.2c)
   - **Home:** the subject it suggests, with Other to pick by hand.
   - **Looks like** or **Fits with:** close entries, each with Link.
   - Link something else, to link by hand.
   This needs no helper, so it works with the Mac mini out of reach.
8. **Feelings in his own words, no number.** (A.4d) See below.
10. **No filter chips left.** (A.4a, A.4d, A.6)
   - Subject page timeline: one Filter button beside the Timeline heading (feelings, facts, done, a date range). When a filter is on, a small line shows it: "Showing feelings · Clear".
   - Feelings and Find use smart suggestions as he types, the same as search while typing on +. An empty box shows a short list (his sides, or recent finds).
   - Find narrows by kind through those suggestions: "Only events about Leah", "Only to-dos about Leah".
9. **Subgoals.** (A.4c, A.5, A.2d)
   - A goal can hold subgoals. A subgoal is a goal of its own: its own Page, targets, to-dos and bar. Example: "Get jacked" holds "Lifting numbers" and "Weight and muscle" (SAMPLE).
   - One level only. // DECISION: a subgoal cannot hold subgoals. Why: a deeper tree is a filing job, and the owner never files.
   - The goal Page lists its subgoals, each with a small bar, its count and its next step. A line under the big bar says what it counts.
   - The Goals tab nests subgoals inside the parent's card, indented, each with its own small bar. A subgoal never shows as a card of its own.
   - The goal builder ends with an optional step: "Part of a bigger goal?"
   - Roll-up: the parent's count pools every target and step of its own and of its subgoals (settled by the owner, fork 8).

## Feelings on a subject

A feeling has sides. An example: "I think the people are nice but I am concerned about the amount of work and intensity." That is two sides: the people, and the amount of work and intensity.

**Writing one, fast.** On the Page, "How do you feel about it now?" is one field. No chips. Smart suggestions work like search while typing on +: an empty box lists the sides he has used before; as he types, it offers "Add to The amount of work and intensity" or "Start a new side". A journal works too.

**Stored** as dated lines that quote him, one per side, each linked to the whole entry:
`- 2026-11-12 · feeling · the people · "the people are nice"`

**Shown on the Page:**
- **Where you stand now:** one block per side. The side name is his own phrase. Under it, his latest quote and its date, then one or two earlier quotes as "Before".
- **How it changed:** one or two plain lines about which sides he wrote about, and when. Example: "Since Oct: you write more about the work." It counts lines per side per month. It does not read mood.
- **All feeling lines** opens the timeline filtered to feelings.

**The helper never labels.** It splits a feeling into sides only where he names more than one thing, and it names each side with his words. It never writes "negative", "better" or a score. A quote in the wrong side can be dragged to another side, like any sort. Fork 7 in decisions-for-jj.md.

## How each journey runs

- **J1 to-do on the go:** + then To-do, or long-press +. Type. Home and look-alikes appear as he types (A.2b). Add. A toast says where it went, with Move and Undo. Under 10 seconds.
- **J2 what now:** open the app (A.1a). Overdue, Due today. Done to-dos are gone. "10 more have no date" opens the No date view.
- **J3 rant:** + then Journal (A.2c). One box. "Fits with" shows the open decision and Work; he can link one or leave it to the helper.
- **J4 one client:** tap the GCorp view tab. Or open the GCorp Page.
- **J5 big choice:** + then Decision opens the builder. Or link a journal to the decision. The decision page (A.4b) puts the decide-by date on top, then each option with its bits for and against, then bits not placed yet. He drags a bit onto an option or taps for or against. "I decided" sits at the foot. The helper gathers, never scores.
- **J6 one subject:** the Page (A.4a), unchanged.
- **J7 flat day:** the Goals tab (A.5). Big bars, subgoals, "+2 this month", and the next step to tick.
- **J8 one fact:** Find (A.6). The answer comes first. Suggestions under the box narrow by kind, in place of chips.
- **J9 check the helper:** A.3. Drag anything wrong to the right subject, or tap its tag. The helper learns from it.
- **J10 intake:** + then Intake. It resumes at the next question.
- **J11 Mac mini out of reach:** A.1d. Adds wait on the device. Views, ticks, word search and suggestions while typing all work.
- **J12 settings:** the gear on A.1.
- **J13 a feeling:** the Page's feeling field and its smart suggestions (A.4d).
- **J14 pick up a half-done flow:** the "1 to check" banner on A.1a opens A.3 at the next line. A builder or draft left halfway reopens at the same step.

## Two sizes, one app

The Mac mini is the one home of the brain, and the helper runs there. The phone and the MacBook are remote windows on it, with the same screens.

- **Narrow** (phone, and the MacBook menu bar popover): the phone wireframes. The owner said yes to both the popover and a window (fork 6).
- **Wide** (a MacBook window, A.W): tabs become a left rail with + Add on top. The view tabs sit above the list, and a Page opens beside the list. No screen exists on only one size.
- Each device keeps a copy for reading, ticking, word search and suggestions. Adds wait on the device while the Mac mini is out of reach.

## To check: rare and resumable

- The helper files every bit to its best guess. It flags one only when it cannot pick, so most sorts have nothing to check.
- What is left shows as one banner on home: "1 to check. Pick up where you left off." Never a list, never a red count, no nag.
- Every flow resumes where he left it: a check list, an intake, a builder step, a draft.
- More than about 5 flagged lines is a helper fault to fix, not a chore for the owner.

## Strengths against the intent

- It matches the tab bar the owner named, and the Page and Find he loves.
- "What now" is 0 taps. A client's list is 1 tap, through a view.
- The picker and builders remove blank forms: the owner never guesses a field.
- Search while typing gives something back on every add, before the helper runs. That answers the void (Q14) even with the Mac mini out of reach.
- Everything but the helper works offline on either device.

## Risks against the intent

- **The picker adds a tap to every to-do.** Long-press + skips it, but long-press is hidden. If 10 seconds slips, make To-do the default and the picker one tap away.
- **Big bars and big numbers pull toward a dashboard.** goals.md says no dashboard and no live numbers. These are counts of ticked lines, not live data, but the screen must stay calm on headache days.
- **Views and the Page both show a client's to-dos.** That is two doors, by the owner's choice. Keep the Page's list short (open only) so they do not compete.
- **Drag on a phone is fiddly** with one hand or a headache, and a long list means dragging past the screen edge. Keep the sort list short, and keep long-press Move to as the backup.
- **Suggestions hide the kinds.** With no chips, the owner cannot see up front that Find can narrow to people or goals. The empty box must show a few examples.
- **Splitting feelings into sides** is the one place the helper reads his feelings. It must split only on his own words, or it starts to label.

## Intent files to update if the owner agrees

- to-dos.md: done to-dos leave the list (outcome 1, 5); views replace filters (outcome 3, 4).
- add.md: the picker with builders replaces "two kinds"; Talk becomes Journal; Intake is its own quick choice; search while typing.
- goals.md: big bar and growth numbers; one level of subgoals; how the parent counts them.
- brain.md: feelings by side, in quotes; no rating (open question 1 closed).
- helpers.md: no sort rating; sort is fixed by drag and tag taps; the helper learns from each one.
- README.md: the Mac mini is the one home; phone and MacBook are remote windows.
