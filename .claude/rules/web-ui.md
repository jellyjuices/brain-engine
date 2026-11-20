---
description: Design system, naming, styles and on-screen words for the web app parts and screens.
paths:
  - "app/src/components/**"
  - "app/src/screens/**"
  - "app/src/shell/**"
  - "app/src/styles/**"
  - "app/src/content/**"
---

# Web app UI

The app must look like one app: one idea, one part, one size, one word. If you find two parts for one idea, merge them when you touch them, or at least add no copy.

## Before you build a part

1. Find it in the table. Use it.
2. If it is close, add a prop or variant to it.
3. Only if nothing fits, make `components/<part>/` with one `<part>.module.css`, and add a row here.

If a screen part is needed in a second place, move it to `components/` first. Reason: copies are the main cause of drift.

| Idea                                             | Use                                                                                                                                                                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button                                           | `Button` (`variant`, `size`, `icon`, `block`, `busy`)                                                                                                                                                                                                                              |
| Icon-only button                                 | `IconButton` (always with `label`)                                                                                                                                                                                                                                                 |
| Icon                                             | `Icon` from `components/icon/`                                                                                                                                                                                                                                                     |
| Kind of thing (to-do, journal, person, place...) | `KindIcon` (`name`, `icon`) or `ListRow shape`. One shape per kind. The `add` shape is only for the add button                                                                                                                                                                            |
| Kinds: which shape and icon each kind has        | `KIND_ICON`, `typeLook(type)`, `folderLook(folder)`, `kindLook(kind)` in `lib/notes/kinds.ts`. Spread the result into `ListRow` (`shape`, `icon`) or `KindIcon`. Add a new kind there, and give it a shape in `KIND_SHAPE` in `components/kind-icon/kind-icon.tsx`. Two kinds never share a shape |
| Add button and its quick add                     | `AddPanel` in `TabBar`                                                                                                                                                                                                                                                             |
| Tappable line                                    | `ListRow` (`title`, `sub`, `icon`, `end`, `variant`, `chevron`, `href` or `onClick`)                                                                                                                                                                                                   |
| Group of rows                                    | `List` (`outlined` on a screen, `plain` for to-do lines, `ghost` in a sheet, `menu` for a sheet menu). It draws a `<ul>` and wraps each child in an `<li>`. Rows never draw `<li>`                                                                                                 |
| Line between menu groups                         | `ListDivider` inside `List variant="menu"`                                                                                                                                                                                                                                             |
| Step menu of actions in a sheet                  | `MenuGroups` (`groups`: lists of `{ id, icon, title, variant, chevron, onClick }`, `false` to hide one). It draws the `List`, the `ListRow`s and a `ListDivider` between groups, and focuses the first row                                                                                 |
| Tag, count, removable value                      | `Chip` (`label`, `variant` `tag`/`check`/`accent`, `icon`, `areas`, `onClick`, `onRemove`)                                                                                                                                                                                         |
| Row of chips                                     | `Chips` from `components/chip/` around `Chip`s                                                                                                                                                                                                                                     |
| Screen header                                    | `PageHeader` (`title`, `kicker`, `fallback` or `onBack`, `action`, `areas`)                                                                                                                                                                                                        |
| Group header with a count                        | `SectionHeader` (`title`, `count`, `tone`, `action`)                                                                                                                                                                                                                               |
| Notice with one action                           | `Banner` (`message`, `count`, `actionLabel`, `onAction`)                                                                                                                                                                                                                           |
| Sheet                                            | `openSheet()`, `confirmSheet()`. Both draw `Sheet` from `components/sheet/`                                                                                                                                                                                                        |
| Sheet menu, with steps                           | `MenuGroups` (`selected` draws a tick). The sheet is a dropdown on desktop and a bottom sheet on the phone, by CSS only                                                                                                                                                           |
| Pick one from a list                             | `Select`. A bottom sheet on the phone and a dropdown on desktop, by CSS only                                                                                                                                                                                                       |
| Short message after an action                    | `toast()` from `components/toast/toast-store.ts`. It draws `Toast`                                                                                                                                                                                                                 |
| Sheet top                                        | `SheetHead` (`title`, `context`, `quote`, `onBack`)                                                                                                                                                                                                                                |
| Sheet buttons                                    | `SheetActions`, primary last                                                                                                                                                                                                                                                       |
| Type a value                                     | `TextField` (`label`, `multiline`, `onEnter`)                                                                                                                                                                                                                                      |
| Search                                           | `SearchInput`                                                                                                                                                                                                                                                                      |
| Pick a note, person or tag                       | `SearchList` (`items`, `onPick`, `onAdd`)                                                                                                                                                                                                                                          |
| Pick in another sheet                            | `PickField`                                                                                                                                                                                                                                                                        |
| Pick a day in a field                            | `DateField` (`label`, `value`, `onChange`, `min`, `max`, `yearSteps`)                                                                                                                                                                                                              |
| Pick a note or tag in a sheet                    | `pickNote()`, `pickTag()` from `components/picker-sheet/`                                                                                                                                                                                                                          |
| Ask for a birthday                               | `birthdaySheet()`                                                                                                                                                                                                                               |
| Change a to-do or sort a capture                 | `todoSheet()`, `inboxSheet()`, `sortSheet()` (suggested sort)                                                                                                                                                                                                                      |
| Suggest a note while typing `@` or `#`           | `MentionSuggestions` with `useMentions()`                                                                                                                                                                                                                                               |
| Subject summary on a note                        | `SubjectCard` from `components/subject-card/`                                                                                                                                                                                                                                              |
| Draw note text                                   | `Markdown` (`src`, `path`)                                                                                                                                                                                                                                                         |
| A person named in text (`@Name`, green)          | `Mention` (`name`, `href`)                                                                                                                                                                                                                                                         |
| Pull down to refresh                             | `PullToRefresh` (`onRefresh`)                                                                                                                                                                                                                                                               |
| Sync state line                                  | `SyncStatus`                                                                                                                                                                                                                                                                         |
| Bottom tabs                                      | `TabBar`                                                                                                                                                                                                                                                                           |
| Say when                                         | `WhenPicker` (`choices`, `onPick`, `onNotTodo`)                                                                                                                                                                                                                                    |
| Pick a day only                                  | `Calendar` (`today`, `value`, `min`, `max`, `yearSteps`, `onPick`)                                                                                                                                                                                                                 |
| Long text                                        | `TextArea` from `components/field/`                                                                                                                                                                                                                                                |
| Load a text file                                 | `FilePicker`                                                                                                                                                                                                                                                                       |
| Label on a group                                 | `SectionHeader`. A field or fact label keeps its own label style in its part                                                                                                                                                                                                       |
| Padded box                                       | `Panel`                                                                                                                                                                                                                                                                            |
| Fact on a note                                   | `Fact`, `AddFact`                                                                                                                                                                                                                                                                  |
| To-do line                                       | `TodoRow` (`title`, `tag`, `when`, `checked`, `onCheckedChange`, `onOpen`, `onMenu`, `onLater` for the swipe-left Tomorrow). For a `TodoRef` from `makeTodo()`, use `TodoRefRow` (`done` for a ticked one: a tap opens Mark not done, Edit, Delete; `tickNow` ticks at once)       |
| When a to-do is due                              | `WhenChip` (`label`, `status`). Build both with `whenLabel()` from `lib/notes/when-label.ts`, which also says "Every week · Tue" for a repeating one                                                                                                                               |
| A goal's target or step, with its tick box       | `GoalStepRow` from `components/goal-step-row/`                                                                                                                                                                                                                                            |
| A goal's big percent, bar and "+N this month"    | `GoalProgress` from `components/goal-progress/`                                                                                                                                                                                                                                              |
| A subgoal: its name and small bar, as a link     | `SubgoalLink` from `components/subgoal-link/`                                                                                                                                                                                                                                      |
| Nothing to show                                  | `EmptyState` (`title`, `body`, `size`)                                                                                                                                                                                                                                                  |

## Variants

- Change a look with a prop, never a second part or a one-off class.
- `size`: `sm`, `md`, `lg` (default `md`). `variant`: `primary`, `secondary`, `outlined`, `ghost`, `danger`. No other names.
- CSS for a variant is a class named for the value (`.primary`), set with `clsx`. The base class holds what variants share.
- A part takes data (`title`, `sub`, `icon`, `end`) and draws its own layout. Callers do not pass hand-built markup.

## Look

The code is the source of truth for every value. This file names where values live, never what they are.

- Tokens live in `app/tokens/*.ts`. `app/tokens/design-tokens.css` is built from them. Tokens cover colour, font family, font size, line height, space, radius, shapes, control size, layout and motion. Nothing else is a token.
- Use a token when one fits. A value used in one place stays in that part's CSS, not in the tokens. Never add a token for a single use.
- Type: pick a `--font-size-*` and a `--font-leading-*` step, and write the weight as a number. Match an existing part that plays the same role so the same role looks the same everywhere.
- Spacing: use the `--space-*` scale. Screen sides use `--layout-gutter`.
- Tap targets are at least `--size-control` tall.
- Units: no `px` and no hex in any `*.module.css` or `src/styles/global.css`. Use `rem` and colour tokens. Stylelint blocks both. Never use pure black (`black`, `#000`, `rgb(0 0 0)`). Use `--color-neutral-900`, with `color-mix()` for see-through shades.
- Colour: use a role token (`--background-*`, `--text-*`, `--border-*`, `--status-*`). A one-off tint is a `color-mix()` on a role token where it is used.
- Theme: light or dark comes from the device. Parts never check the theme. The tokens swap.
- Any group of items is a `List` of rows. Dividers come only from `List` or `ListDivider`. A row never draws its own border or box.
- Sheet menus: no line inside a group, a `ListDivider` between groups. Archive, delete and cancel are last, `variant="danger"`.
- A box is one step off what it sits on: `--background-secondary` on a screen, `--background-primary` in a sheet.
- Icons: import the Phosphor `…Icon` part and pass it (`<Icon icon={PlusIcon} />`). Type props with `type Icon as PhosphorIcon`. No icon name strings. One meaning, one glyph. Size an icon where it is used.
- A chevron means "opens a next step". Back is an arrow, top left. Close is ×, top right of a sheet. The primary action is last and full width. Other actions are `outlined`.
- One surface at a time. Never stack a sheet on a sheet.
- Dates: `longDate()`, `niceDate()` from `lib/notes/model.ts`. Note-type lists and icons live in `lib/notes/`.
- Hover: write `:hover`, then undo it in a local `@media (hover: none)` below. No shared hover helper.
- No `text-transform: uppercase`. Values that change all the time go on the element `style`, not a CSS rule.

## Experience

- Keep the crafted parts. The Add panel, its blob shapes, motion and tool bar took a long time to tune. A new idea fits into a slot that exists (the tool bar's drawer, a sheet, a builder step). Never redraw a part to add a feature.
- Show where it went. After any add or move, the toast names the place: "Added to Gym", never just "Saved".
- One idea per row. A list row holds the item and at most one small state mark. Choices and details go in a sheet behind a tap. No buttons or chips crammed into a row's end.
- A state is a mark, not a sentence. A suggested sort is a dot in `--background-accent`. Do not explain why the app guessed.
- A suggestion is labelled "Suggested sort" with `SparkleIcon`. The owner's own pick never shows a sparkle.
- Sheet order, top to bottom: a small context line with its icon, a title that asks the action ("Add to Health (topic)?"), the item itself as its real row, the primary action, then the way out ("Somewhere else").
- Quick picks while typing are `Chip variant="accent"` in the tool bar's drawer: `AtIcon` for a person or subject, `HashIcon` for a tag. Centred. They fade up in turn as they are found. Use `DestinationChips` from `components/add-panel/` with `homeGuesses()` from `lib/notes/home-guess.ts`. A tapped chip is the to-do's home and shows `CheckIcon`.
- On a dark or accent surface, use the accent-soft chip so it matches the tool buttons. Never a grey chip on the blob.
- Pick many from a list: `ListRow checked`. It draws a checkbox on the left, green when checked, and sets `aria-pressed`. Pick one: a `CheckIcon` in `end`.
- Picking subjects looks like the `@` drawer: rows with the kind's `KindIcon` and icon (spread `typeLook()`), the type as secondary text, a tick when picked. Multi-select. A "Suggested" group comes first, then the rest.
- Pick notes to add to a subject: an Add pill in the row's end (`Chip`), "Added" with `CheckIcon` once picked. This is the one place a chip sits in a row's end.
- Wizard steps fill the screen. The buttons sit at the bottom. A new person, place or thing is a three-step builder at `/build/<kind>` (name, what it goes with, notes to add). `WizardStep` draws the same `PageHeader` as intake (back arrow top left, step count at the end). A button that saves says the action ("Add person", "Add Louis to Health"). Every step after the first saves nothing until tapped and has Skip.
- A file note's page is the note page: `FileBody` and `FileResults` take the place of the body. A section still waiting on an ask shows a busy `ListRow`. Its words say it waits for a helper; never say it is working when nothing runs.
- A picked or done state is green (`accent`) and past tense: "Added", with `CheckIcon`.

## Naming

- Files and folders kebab-case (`todo-row/todo-row.tsx`). Components PascalCase. Sheet openers camelCase ending in `Sheet` (`todoSheet()`). A function that opens a sheet to pick one thing starts with `pick` (`pickNote()`).
- A folder is named after its main part. Sheet step files start with the sheet name and end in `-step` (`todo-date-step.tsx`).
- Name a part for what it is or does. Read what it renders before you name it. Never name it for how it looks or moves: no `line`, `blob`, `arc`, `shape`, `box`.
- The last word says the role. One role, one word:

| Last word | Means | Example |
| --- | --- | --- |
| `Row` | a tappable row in a list, built on `ListRow` | `TodoRow`, `GoalStepRow` |
| `Entry` | a dated record of text | `TimelineEntry` |
| `Link` | a link to one place | `NoteLink`, `SubgoalLink` |
| `List` | a list of rows | `SearchList` |
| `Sheet` / `Step` | a bottom sheet / one step in a sheet or wizard | `TodoSheet`, `TodoDateStep`, `WizardStep` |
| `Menu` | a list of actions | `AddMenu`, `MenuGroups` |
| `Picker` | chooses a value | `WhenPicker` |
| `Input` / `Field` | a form control / a control with its label | `AddInput`, `TextField` |
| `Button` | a button | `IconButton`, `ToolbarButton` |
| `Bar` / `Toolbar` | a strip across the screen / a strip of buttons | `TabBar`, `ProgressBar`, `AddToolbar` |
| `Chip` | a small inline label | `WhenChip` |
| `Status` | live status text | `SyncStatus` |
| `Header` | the top of a page, sheet or note | `PageHeader`, `NoteHeader` |
| `EmptyState` | the nothing-here message | `EmptyState` |

- Standard pattern, standard name: `Combobox`, `Checkbox`, `Toolbar`, `PullToRefresh`, `SwipeActions`.
- Routes are named for the screen (`/add`, `/journal`), and the screen folder matches the route.
- Class names are camelCase in the part's CSS Module (`.todoDue`). States start with `is` (`.isLate`). Variants are the value (`.primary`).
- Props say what they hold. Events start with `on`.

## Words on screen

- Every word, `aria-label`, placeholder and toast lives in `src/content/*.ts`. Import `copy` from `@/content/index.ts`.
- Words with a slot are a function with a template string: `remove: (name: string) => \`Remove ${name}\``. Call it: `copy.common.remove(name)`.
- Pick the file by where the words show. Shared words go in `common.ts`. Reuse a key first. Keys are camelCase (`chooseDay`).
- Use only the "Words the owner sees" in `AGENTS.md`. Buttons are verbs. Short toasts. Canadian spelling.
- Action first. A title or question says what will happen ("Add notes to Louis?"). The secondary line gives context ("To-dos and notes that already name Louis.").
- Name the thing. Never "these", "it" or a bare count. A button says verb, what and where: "Add 2 to Louis", not "Link 2".
- Use the real name ("Louis", "Health"), never a role ("the new user", "the subject").
- Say what kind of thing a list holds ("to-dos and notes"), not a code word ("entries", "items").
- Pick one verb for one action and keep it through the flow: the pill, the hint and the button all say "Add".
- No reasons the owner did not ask for ("3 other to-dos are in Health"). If they want why, it is one tap away.
