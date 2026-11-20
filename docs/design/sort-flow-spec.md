# Spec: where it went (A, B, C)

Built 2026-11-19 from the Storybook mocks, which are now deleted. This spec says how each flow works in the real app.

## Rules for all three

- No AI on the device or the server. Guesses come from names and tags the brain already has (helpers.md, outcome 1).
- Each screen uses the real parts: `AddToolbar`, `Toast`, `Sheet`, `WizardStep`, `ListRow`, `List`, `NoteRead`.
- Pages sit inside the screen host, so the gutter and top space match every other note page.

## A. To-dos

### A1. Suggested home while typing

- Where: the Add panel, to-do mode. The chips sit in the tool bar's drawer.
- Source: `homeGuesses(notes, text)` in `lib/notes/home-guess.ts`. A subject whose title, or first name for a person, is a whole word in the text. A tag in use whose name is a whole word. At most 3, subjects first.
- Shown only when no `@` or `#` drawer is open and the text has 3 or more letters.
- Chips fade up one after another (`chip-rise`).
- Tap a chip: it becomes the home. It turns solid with a check. Tap again to clear it. Only one home at a time.
- Save: a subject home is sent as `into`. A tag home is added to `tags`.

### A2. The toast says where it went

- After a to-do saves: "Added to Gym", detail "Fri, Nov 20" when the text names a day.
- No home and no `@` or `#`: "Added to Unsorted".
- Actions: Move and Undo.
  - Undo sends `undo`.
  - Move sends `undo`, then opens the Add panel with the same text, so the owner picks another home.

### A3. Unsorted to-dos

- Where: the To-dos screen, under the header, in place of the old banner link.
- A banner "N to sort", then one row per unsorted capture.
- A row with a guess ends in a green dot.
- Tap a row: a sheet.
  - With a guess: a sparkle and "Suggested sort", the title "Add to Health (topic)?", the to-do, the button "Add to Health" and the button "Somewhere else".
  - No guess: the title "Where does this go?" and the button "Pick a subject".
  - "Somewhere else" and "Pick a subject" open the subject picker. The pick sorts the capture.
- Sorting sends `sort` with the capture path and the subject path.

## B. Building out a person

After "Add a person" saves, the app opens the person builder at `/person-build/<path>`. Step 1 was the name sheet, so the builder starts at step 2 of 3.

### B1. How do you know Louis?

- Rows like the `@` drawer: shape and type on each.
- "Suggested" first: subjects named in the same lines as the person. Then "All subjects".
- Pick one or more. A picked row ends in a check.
- Next sends one `relation` per pick (`/api/relations`, from the person to the subject).

### B2. Add notes to Louis?

- Lists live notes and to-dos whose text names the person (by full name or first name) and do not yet link to them.
- Each row ends in an Add pill. A picked pill turns green and says "Added".
- The button says "Add 2 to Louis". With none picked it says "Done".
- Add sends one `relation` per pick, from the note to the person.
- Skip on either step moves on. The last step returns to the person's page.

## C. Adding a file

### C1. How should workbook-ch2 be incorporated into the brain?

- After the owner picks a file on the New screen, the app opens `/file-add`. The file waits in memory.
- Three ticks: "Break it up into to-dos and notes", "Write intake questions", "Add to the notes you already have".
- The helper line: the file is always kept in Resources.
- The button: "Add workbook-ch2".

### C2. Working

- Add sends the file with `asks` (the ticked ways). The server keeps them in the note's `asks` field.
- The app goes straight to the file's note page. The toast says "Added workbook-ch2 to Resources".
- The page is the normal note page: the header, the intro, then the file. The file shows its opening and a "Read the whole file" button.
- Each ask still in `asks` shows a spinner row: "You can leave. It waits for a helper."
- A helper does the work in a chat the owner starts. When it finishes a way, it takes that way out of `asks`. Once Ollama runs on the home server, `brain serve` does it on its own (handoff #23).

### C3. Done

- When a way is out of `asks`, its section fills in:
  - "To-dos it found": open to-dos in notes that link to the file.
  - "Notes it added to": notes that link to the file.
  - "Intake": "N questions ready" from the file note's `# Intake` list, and "Start the intake". For now it opens the normal intake, not the file's own questions (handoff #24).
