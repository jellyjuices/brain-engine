# Add flows: every kind

Nov 14, 2026 · plan only · written by Claude · inputs: `docs/intent/*`, concept A (rev 2), `routes/table.ts`, `api-types*.ts`, design system in `brain-engine-wt/s1`, `starter/.schema` and `.templates`.

Goal: each add takes the fewest steps, asks nothing the app can work out, and loses nothing if the owner stops halfway.

## How to read this

- **Box** is the one-line add box (Add panel, To-do or Journal mode, `AddBox`).
- **Builder** is the full-screen step flow (`BuilderStep` with `useBuilder`). It opens from Add, then the third arc choice ("Other", now `/new`).
- **Page** is a subject page, goal page or decision page.
- **S1 to S6** are shared steps. **R, T, O, L** are shared rules. Each is defined once below and reused by name.
- Route names are the `tool` names in `routes/table.ts`. `G1` to `G12` point to the Gaps table at the end.
- Button words (Add, Back, Next, Skip, Undo) are plain UI words. Concept words on screen come only from the owner word list.

## One-page summary

"Taps to add" counts screens where the owner must act, at the minimum. "Full" counts every builder step.

| Kind | Main entry | Taps to add (min / full) | Minimum to add | Main route |
| --- | --- | --- | --- | --- |
| Plain capture | Share into the app; Find with no result | 1 / 1 | words | `add` (no kind) |
| To-do | Add, then To-do; long-press + | 1 / 1 | words | `add` (kind todo) |
| Note (fact line) | Page: "Add a note" field | 1 / 1 | words + the page's subject | `add` + `sort` today, `add` kind fact after G4 |
| Feeling line | Page: "How do you feel about it now?" | 1 / 2 | words + subject | same as fact, kind feeling (G4) |
| Journal | Add, then Journal | 1 / 1 | words | `add_journal` |
| Person | Builder: Person; a new name typed in the Box | 1 / 4 | name | `make_note` (G6, G7) |
| Group | Builder: "Place, thing or more" | 1 / 3 | name | `make_note` |
| Place | same | 1 / 3 | name | `make_note` |
| Thing | same | 1 / 3 | name | `make_note` |
| Topic | same | 1 / 3 | name | `make_note` |
| Project | Builder: Project | 1 / 4 | name | `make_note` + `add` |
| Event | Builder: Event | 2 / 4 | what + date | `make_note` (G6) |
| Goal | Builder: Goal | 1 / 6 | name | `make_note` (G6, G7) |
| Subgoal | Goal page: + subgoal | 1 / 5 | name (parent is set) | `make_note` with `parent` (G6) |
| Decision | Builder: Decision | 1 / 6 | the question | `make_note` (G6, G7) |
| Area | Brain, Areas list: + | 1 / 2 | name | `make_note` (G10) |

// DECISION: every builder shows **Add** as soon as the name step is filled. The rest of the steps stay open but optional. Why: "only the words are required" (README constraint 6), and the owner often stops mid-thought. Other design: walk every step with Skip on each, as in concept A.

## Shared rules

### The reader (runs on the device while the owner types)

The reader pulls answers out of the typed text, so a step that the text already answers is skipped. It never rewrites his words. Typos and swearing stay as typed.

| It finds | Example | It fills | Shows as |
| --- | --- | --- | --- |
| A date word (English) | "fri", "tomorrow", "nov 20", "someday" | When? | `WhenChip` under the box |
| A time | "3pm", "15:00" | event time | part of the When chip |
| A known name | "Lynda", "@lynda" | Who with? | person `Chip` |
| An unknown capitalised name after "with", "call", "text", "ask" or "@" | "call Louis" | Who with? (new) | `Chip` "Louis · new person" |
| A subject match (word search on the device copy, fuzzy) | "gadv", "the gym" | About what? | Home row in `SuggestInput` |
| The page he opened + from | Leah's page | About what? | Home row, locked on top |

The reader uses `parseWhen` rules (`src/todos/when-words.ts`) ported to the device, so phone and server agree. Japanese and Spanish date words are not read (see L). A chip can always be tapped to remove a wrong guess.

### R: resume (drafts)

| When | What happens |
| --- | --- |
| Every keystroke (debounced 1 s) and every step change | The device saves the draft locally. When online it also calls `save_draft` with `kind` (`add` or `builder`), `step` and `data`. |
| The owner closes the box or builder with text in it (scrim tap, back gesture, app killed) | Nothing is lost. The draft stays. |
| He opens the same entry again | The box opens with his text in it. A builder opens at the same step. No question. |
| A draft sits more than 10 minutes | To-dos home shows one `Banner`: "1 add to pick up. Pick up where you left off." Tap opens it. Never a red count. |
| He adds | The add sends `draft_id`, and the server clears it. The device clears its copy on success. |
| He taps Delete on the banner's menu | `delete_draft`. |
| A draft is untouched for 14 days | It is thrown away (G1). |

An empty box or a builder with no name makes no draft.

### T: after add

- A `toast` names where it went: "Added to Leah", "Added to General", "Person added: Louis".
- The toast has **Undo** (`undo`) and one **Move** or **Open**, by kind.
- A builder lands on the new note's page, with the same toast. Undo there reverts the whole builder only after G7. Today a builder makes several writes, and `undo` reverts only the last.
- The new item shows at once from the device copy, marked as not yet synced (the `sync-line`).

### O: offline

- Every add goes through the device write queue (`queueInbox`, `queueJournal`, `queuePerson`, `queueSubject`). The owner sees "Added" at once. A `client_id` makes a retry safe.
- A builder offline is one queued call after G7. Before G7, writes that need the new note's path (relations, first to-do) wait on the first write.
- Suggestions while typing work offline: word search runs on the device copy.

### L: languages

- Japanese and Spanish text is saved as typed. Word search finds it. Meaning search is English only, so "Fits with" may show nothing for Japanese. That is fine.
- A Japanese title makes the file name `note.md` today, because `slugify` drops non-Latin letters (G8).
- Date words in Japanese or Spanish ("金曜", "viernes") are not read. The When chip stays empty, and S2 is still one tap.

## Shared steps

Each shared step is one question, one control, and a Skip that changes nothing.

### S1: About what?

| Part | Value |
| --- | --- |
| Question | "About what?" |
| Control | `SuggestInput`. Top row: the reader's Home guess. Then recent subjects. Then "New subject: <words>". |
| Prefill | The page he opened + from (locked on top). Else the reader's subject match. Else the last subject he picked in the past 10 minutes. |
| Pick more | Yes. Each pick is a `Chip` with remove. |
| Skip | No subject. A to-do goes to General (`areas/general.md`). A capture waits for the helper. |
| Writes | `about: [path]` on `add`, or `subjects` on a decision, or a relation via `add_relation`. |
| "New subject" | Opens the mini name step (S5) for a Topic by default, with the kind as a `Chip` he can change. Returns here. |

### S2: When?

| Part | Value |
| --- | --- |
| Question | "When?" |
| Control | A row of `Chip`s: Today, Tomorrow, Weekend, Next week, Someday, A date (opens `calendar` / `date-field`). Events add a time field. |
| Prefill | The reader's date word. |
| Skip | No date. The to-do shows under No date, never on Today. |
| Writes | `due` on the to-do line. Today the date stays in the text (G3). |

Waiting on someone is not a When answer. It is a switch in the row menu, after add.

### S3: Who with?

| Part | Value |
| --- | --- |
| Question | "Who with?" |
| Control | `SuggestInput` over Person notes, then "New person: <name>". |
| Prefill | Names the reader found. |
| Skip | No people. |
| Writes | `people: [path]` on `add`, `with` on an event, or `add_relation` for builders. |
| New person | Queues `add_person` with just the name, then links it. No builder. The person page later shows "Added from a to-do. Add how you know them?" |

### S4: Which areas?

| Part | Value |
| --- | --- |
| Question | "Which areas?" |
| Control | Area `Chip`s with `AreaMark` dots, multi-pick, 1 or more, no upper limit. |
| Prefill | Areas of the subjects picked in S1 or of the parent goal. Else the areas of the last goal or project he made. |
| Skip | Keeps the prefill. With no prefill, `general`. |
| Writes | `areas: [...]` in frontmatter (G6). |

// DECISION: S4 is a step only in Goal, Decision and Project. Subjects get their areas guessed from their links and shown on the page, where one tap changes them. Why: a subject is often added mid-thought, and areas are a filing job.

### S5: Name

| Part | Value |
| --- | --- |
| Question | By kind: "Who is it?", "What is it called?", "What do you want?", "What is the choice?" |
| Control | A text field with live matches under it (`SuggestInput` over notes of the same type). |
| Prefill | Words he typed before (from Find, or a name chip in the Box). |
| Skip | None. It is the one required step. |
| Duplicate | A same-type match shows on top: "You already have Leah (friend from work). Open it?" `make_note` also returns `created: false` for an exact match, and the app then opens that note with the toast "You already have it." |

### S6: One line about it

| Part | Value |
| --- | --- |
| Question | By kind: "How do you know them?", "What is it?", "Why does it matter to you?" |
| Control | One text field. Up to 150 letters go to `description`. Longer text goes to the note's first section. |
| Prefill | None. |
| Skip | Description stays empty. `brain check` needs a description on a filed note, so the server writes "Added from the phone." as today. |

## Flows by kind

### Plain capture (no kind)

- **Reaches for it:** a thought that is not clearly a to-do, or text shared from another app.
- **Entry:** Android share sheet into the app; Find with no result ("Add these words"); agents.
- **Steps:** 1. Type or share. Tap Add.
- **Minimum:** words. **Later:** nothing; the helper sorts it.
- **Writes:** `add` with `client_id`, `text`, no `kind`. With a tag, person or subject it is filed at once (`saved: "filed"`). Else it waits in `inbox/` (`saved: "inbox"`) for the helper.
- **Resume:** R, as a box draft.
- **After add:** toast "Added. It will be sorted." or "Added to Leah". Undo. Next action: none; he goes back to what he was doing.
- **Edge cases:** a shared URL is kept as text. A shared file goes to File (`add_file`).

### To-do

- **Reaches for it:** "I have to do this."
- **Entry:** Add, then To-do; long-press +; + on a Page (About what? set); Find with no result.
- **Steps:**
  1. "What do you need to do?" `AddBox`. Under it, live: Home row (S1 guess), When chip (S2 guess), people chips (S3), and "Looks like" matches with Link. Tap Add.
- **Minimum:** words. **Later, from the row menu:** About what?, When?, Moves me toward (a goal), Waiting on someone.
- **Writes:** `add` with `kind: "todo"`, `text`, `about`, `people`, `client_id`, `created_at`. The line goes under `# To-dos` in the subject, else General. Goal link token: `· toward [Goal](../goals/<slug>.md)`, suggested from the subject (goals.md outcome 9) as a chip he can tap.
- **Resume:** R. Closing the box with text keeps it.
- **After add:** toast "Added to Work · Move · Undo". The box stays open, empty, for the next to-do (the owner often dumps several). A second tap on the scrim closes it.
- **Edge cases:**
  - New person mid-sentence ("call Louis about the deck"): the chip "Louis · new person" is on by default. Add queues `add_person` then the to-do with `people`. Tap the chip to turn it off.
  - Subject that does not exist ("fix the bike"): Home shows "New subject: bike?" as a choice, never picked for him. No pick: General, and the helper may file it later with `· check`.
  - "dentist fri 3pm": stays a to-do with a date. The toast adds "Make it an event" (owner decision 5).
  - A client's own task: paste the link in the text; the line keeps it. No copy of the task.

### Note (a fact line on a subject)

- **Reaches for it:** "Leah's birthday is March 3", "the clinic closes at 5".
- **Entry:** the Page: an "Add a note" field above the timeline. From the Box it is a capture, sorted later.
- **Steps:** 1. "What do you want to remember?" One field, `SuggestInput` showing "Looks like" lines already on this subject. Tap Add.
- **Minimum:** words; the subject is the page.
- **Writes:** a dated fact line in the subject: `- 2026-11-14 · fact · <his words>`. Today this is two calls: `add` (capture) then `sort` with one bit `kind: "fact"`, `into` the page. After G4: one `add` with `kind: "fact"`, `into`.
- **Special fields:** "birthday" in a Person fact also calls `set_birthday` when the reader finds a full date. He sees "Birthday set: Mar 3" in the toast.
- **Resume:** R, keyed to the page.
- **After add:** the line shows at the top of the timeline. Toast with Undo. Next action: another note.
- **Edge cases:** a fact about the owner himself goes to a lens through intake or journal, not here.

### Feeling line

- **Reaches for it:** "How do I feel about this job right now?"
- **Entry:** the Page: "How do you feel about it now?" (concept A, A.4d).
- **Steps:**
  1. Type. The field suggests his sides on this subject: "Add to: the amount of work" or "Start a new side". Tap Add.
  2. Only if he typed with no side picked and the subject has sides: "Which side?" as `Chip`s of his own phrases, plus "New side". Skip: no side; the helper may split it later.
- **Minimum:** words + subject.
- **Writes:** `- 2026-11-14 · feeling · <side> · "<his words>"`. Today: `add` then `sort` with a bit `kind: "feeling"`, `about: <side>`. After G4: one `add`.
- **Never:** a mood scale, a label, or a suggested word for how he feels.
- **Resume:** R. **After add:** the "Where you stand now" block updates. Toast with Undo.
- **Edge cases:** a long feeling with many sides: suggest Journal ("This looks long. Add it as a journal?") once, as a link, not a block.

### Journal

- **Reaches for it:** overwhelmed, needs to dump a lot.
- **Entry:** Add, then Journal; + on a Page then Journal (About what? set); a decision page's "Rant" button (About what? = the decision).
- **Steps:** 1. One big box, with the full-screen toggle (`AddFull`). "Fits with" shows close subjects and open decisions, each with Link. Tap Add.
- **Minimum:** words.
- **Writes:** `add_journal` with `date` (today), `text`, `about` (page or Link), `created_at`. In the new shape this makes one Journal note per entry, with a generated title. The day can hold several.
- **Title:** // DECISION: the server makes the title after add, from the first line (cut at 60 letters). The toast shows it: "Journal added: Rough morning at work · Edit title". Why: asking for a title first slows the dump. Other design: a title field on top of the box.
- **Date:** today by default. A "Date" chip under the box picks an earlier day. Text written between midnight and 4 am asks nothing and uses the calendar date.
- **Resume:** R. A journal draft is the most important one: it saves every second and survives a killed app.
- **After add:** toast with Edit title, Undo. He stays where he was. The entry waits for a Claude chat to sort it into bits. Next action: none.
- **Edge cases:** self-harm words: the app does nothing special; the helper chat follows the 9-8-8 rule. Over 60 KB: the box says "This is too long for one entry. Add it as a file?" before Add, never after.

### Person

- **Reaches for it:** someone new matters, or comes up a lot.
- **Entry:** Builder: Person; the "New person" chip in the Box (no builder, name only); Find with no result on a name.
- **Steps:**
  1. S5 "Who is it?"
  2. S6 "How do you know them?" Goes to `# How we know each other` and a short `description`.
  3. "Anything to remember?" Birthday (`date-field`), partner, one free line. Skip: nothing.
  4. "Which groups?" `SuggestInput` over Groups, with "New group". Skip: none.
- **Minimum:** name. **Later from the page:** facts, feelings, relations, groups.
- **Writes:** `make_note` type Person (dedupes by name). Today: then `set_birthday`, `edit_note` for the section, `add_relation` per group. After G6 and G7: one `make_note` with `fields`, `sections`, `relations`.
- **Resume:** R as a builder draft, step and answers.
- **After add:** the person page. Toast with Undo. Next action: "Add a to-do with Louis".
- **Edge cases:** two people with one name: S5 shows the existing one with its description. Picking "New person" saves as "Sam (gym)" if he types it so; the app never adds the suffix for him. A name in Japanese: G8.

### Group, Place, Thing, Topic ("Place, thing or more")

- **Reaches for it:** a company, family, clinic, city, thing he owns, or a subject that grows.
- **Entry:** Builder: "Place, thing or more", then a kind `Chip` row on top of step 1 (Place, Thing, Group, Topic). The reader guesses the kind from words ("clinic", "inc", "family"); default Topic.
- **Steps:**
  1. S5 "What is it called?" with the kind chip row above.
  2. S6 "What is it?" Goes to `description` and `# What` / `# Who` / `# Summary` by type.
  3. "What does it tie to?" S1 and S3 merged in one `SuggestInput`: people and subjects. Skip: none.
- **Minimum:** name. **Later:** Thing fields `from`, `renews`, `papers`; to-dos; notes.
- **Writes:** `make_note` with type and title. Links via `add_relation`.
- // DECISION: builders use `make_note` for every type. `add_person` and `add_subject` stay for the old app. Why: one route with one shape keeps the build small.
- **Resume:** R. **After add:** the new page. Next action: "Add a to-do".
- **Edge cases:** the same name in two kinds (a Topic and a Group "Work"): S5 shows both. A Note document (meeting notes, reference text) comes from File, `add_file`, not here.

### Project

- **Reaches for it:** work that ends when it is done.
- **Entry:** Builder: Project; a Group page's + (for whom set).
- **Steps:**
  1. S5 "What is the project?"
  2. "Who is it for?" S1 limited to Groups and People, with "New". Prefill: the page.
  3. S4 "Which areas?" Prefill: the areas of step 2's subject.
  4. "What is the first to-do?" `AddBox` with the reader. Skip: none.
- **Minimum:** name. **Later:** status, next step, links, a goal.
- **Writes:** `make_note` type Project, `add_relation` to the group, `add` with `kind: "todo"`, `into` the project. The template has no `# To-dos` heading today (G11).
- **Resume:** R. **After add:** the project page with its first to-do. Next action: "Moves me toward" a goal.
- **Edge cases:** a project name that matches a Group: S5 shows the group and asks nothing more; he picks or keeps typing.

### Event

- **Reaches for it:** a visit, appointment or meeting on a date.
- **Entry:** Builder: Event; the toast's "Make it an event" after a dated to-do (all steps prefilled).
- **Steps:**
  1. "What is it?" One field. The reader fills steps 2 and 3 from "dentist fri 3pm with Lynda".
  2. S2 "When?" with a time field. No Someday chip. Required.
  3. S3 "Who with?"
  4. "Anything to prepare?" A short list of to-do lines (each a `TodoRow` once typed). Skip: none.
- **Minimum:** what + date.
- **Writes:** `make_note` type Event with `date`, `with`, `status: upcoming` (G6). Prep lines go under `# Prep` or `# To-dos` (G7).
- **Resume:** R. **After add:** the event page. It shows on Today on its date. Next action: add to calendar is automatic through `calendar`.
- **Edge cases:** the template heading `# Outcome` shows a banned word on screen (G2). A past date asks nothing. It stays `upcoming`, and Today shows it as overdue, so he ticks it. A repeated visit: one event per date.

### Goal

- **Reaches for it:** a big aim, months or years long.
- **Entry:** Builder: Goal; a Goal page's "+ subgoal" (see Subgoal).
- **Steps:**
  1. S5 "What do you want?"
  2. S6 "Why does it matter to you?" Goes to `why` and `# Why`, in his words.
  3. "How will you know you are getting there?" Target lines, one per row ("Bench 185 lb"). Skip: none; progress counts steps only.
  4. "What is one first step?" `AddBox` with the reader. Skip: none.
  5. "Part of a bigger goal?" Picker over active goals with no parent. Skip: a top goal.
  6. S4 "Which areas?" Prefill: the parent's areas, else words in the name.
- **Minimum:** name.
- **Writes:** `make_note` type Goal with `why`, `areas`, `parent`, `status: active` (G6). Targets as `- [ ] <line>` under `# Targets` (G7). The first step: `add` with `kind: "todo"` and the token `· toward [Goal](../goals/<slug>.md)`, into the subject he linked, else General.
- **Resume:** R. **After add:** the goal page. Next action: tick the first step.
- **Edge cases:** a goal that sounds like a project ("finish the deck"): no question; he decides. A goal from the Future lens comes from a helper, with his yes; not this flow.

### Subgoal

- **Entry:** Goal page: "+ subgoal". Parent is set; step 5 is gone.
- **Steps:** Goal steps 1 to 4, then S4 prefilled from the parent (5 steps).
- **Rule:** a subgoal's page has no "+ subgoal". One level only.
- **Writes:** as Goal, with `parent` set.

### Decision

- **Reaches for it:** a big choice that touches many parts of his life.
- **Entry:** Builder: Decision; a goal page's "+ decision" (relation to the goal set).
- **Steps:**
  1. S5 "What is the choice?" Saved as a question, as typed.
  2. S1 "What does it touch?" Suggested from the words. Multi-pick.
  3. "What are the options?" Option lines, one per row. Skip: none.
  4. "Decide by when?" S2 with no Someday chip. Skip: no date.
  5. S4 "Which areas?" Prefill: the areas of step 2's subjects.
  6. "Want to get it out of your head now?" The Journal box. Skip: none.
- **Minimum:** the question.
- **Writes:** `make_note` type Decision with `subjects`, `decide_by`, `areas`, `status: open` (G6). Options under `# Options` (G7). A decide-by date adds one to-do "Decide: <question>" with that `due`. Step 6 calls `add_journal` with `about` = the decision, so the entry waits to be sorted into buckets like any journal.
- **Resume:** R. **After add:** the decision page. Next action: add a rant.
- **Never:** scores, a lean, or "you should".

### Area

- **Reaches for it:** rare: a new part of life, such as a new job.
- **Entry:** Brain, Areas list, + at the foot. Not on the Add picker.
- **Steps:**
  1. S5 "What is the area called?"
  2. "What does it cover?" One line to `# What this covers`.
- **Minimum:** name.
- **Writes:** `make_note` type Area. A key colour must be picked for it (G10).
- **After add:** the area page. Toast with Undo.

## Entry points, once

| Entry | What it opens | Prefill |
| --- | --- | --- |
| + tap | Arc: To-do, Journal, Other | nothing |
| + long-press | To-do box | nothing |
| + on a Page | Arc, then the kind | About what? = the page |
| Page fields | Note, Feeling | the page |
| Goal page | + subgoal, + decision | parent, or the goal relation |
| Find, no result | Two rows: "Add as a to-do", "Make a note for <words>" (opens "Place, thing or more", or Person when the words look like a name) | the words as text or name |
| Share sheet | Plain capture box | the shared text |
| Laptop (wide) | + Add on the left rail; same flows | same |

## Gaps

Smallest change first.

| # | Gap | Needed by | Change |
| --- | --- | --- | --- |
| G1 | Old drafts never go away | R | `drafts` deletes drafts with `updated` older than 14 days. |
| G2 | Event template heading `# Outcome` shows a banned word | Event | Rename to `# What happened` in `starter/.templates/event.md` and its readers. |
| G3 | `add` has no `when` field | To-do, S2 | Optional `when` on `AddRequest`, read with `parseWhen`. The text stays as typed. |
| G4 | `add` cannot write a fact or feeling line | Note, Feeling | `kind: "fact" \| "feeling"` plus `about` (the side) on `AddRequest`, with `into`. Same writer as a sort bit. |
| G5 | A journal title cannot be edited | Journal | `edit_note` accepts `title`. The path stays the same. `add_journal` returns `title`. |
| G6 | `make_note` takes only type, title, description | All builders | Optional `fields` (why, when, date, with, decide_by, subjects, birthday, from, renews), `areas` and `parent`, checked against the schema. |
| G7 | A builder is several writes: undo reverts one, offline needs a chain | All builders, T, O | `make_note` also takes `sections` (lines under headings), `relations` and `todos`. One call, one log entry, one undo. |
| G8 | A non-Latin title makes `note.md` | L | `slugify` keeps letters in any script (Unicode letters and digits). |
| G9 | No `client_id` on `add_journal` | O | Add it, like `add`, so a retry after a dropped link is safe when the text was edited. |
| G10 | A new area has no key colour | Area | Pick the next unused colour from the area palette; store it with the area. Where colours live today is not checked. |
| G11 | Project template has no `# To-dos` | Project | Add the heading to `project.md`. |
| G12 | Drafts are server-side only | R, O | The device keeps its own draft copy and syncs it with `save_draft`. Client change only. |

## Owner decisions

Settled by the owner on 2026-11-15, except 4 and 6, which wait for one answer each. Where a flow above disagrees with this table, this table wins.

| # | Question | The owner's answer |
| --- | --- | --- |
| 1 | Long-press + | One gesture. Long-press opens the drawer of kinds. The owner keeps his finger down, drags to a kind and lets go. The kind under his finger on pointer-up opens. Letting go outside every kind closes the drawer. |
| 2 | When a builder saves | After every step, the name step included. The note exists once it has a name. Each later step saves on its own. |
| 3 | Journal title | Made on save, on its own, from the first words. The owner can edit it after. |
| 4 | Half-done adds | A subject that the owner started in a builder and did not finish shows on the home screen as "Continue filling out <name>". Open: how long that line stays (see below). |
| 5 | "dentist fri 3pm" in the To-do box | It stays a to-do. The app offers "Make it an event" while he types. The check runs on a long debounce, so the heavy read does not run on each key. |
| 6 | Areas for a new subject | Open: the owner asked what this means (see below). |
| 7 | Japanese titles in file names | Keep the Japanese letters. |

### Open

- **4.** Because of answer 2, a half-done subject is already saved. Only its later steps are empty. Pick: the "Continue filling out" line stays until the owner finishes the steps or dismisses the line. Nothing is deleted. Typed words in the add box that were never saved come back when he opens the box again.
- **6.** Each subject belongs to 1 or more areas, such as Health or Career. Option A (pick): the app guesses the areas from the page the owner is on and from linked notes, and shows them as chips he can change. Option B: the builder asks "Which areas?" as a step each time.

### From the owner's capture on 2026-11-15

- Project must be one of the kinds the owner can add from the drawer.
- A project can be marked finished. Check `starter/.schema/types.yaml` for a project status and add a "finished" state with one action on the project page.
