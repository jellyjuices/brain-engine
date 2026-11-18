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

| Idea | Use |
| --- | --- |
| Button | `Button` (`variant`, `size`, `icon`, `block`, `busy`) |
| Icon-only button | `IconButton` (always with `label`) |
| Icon | `Icon` from `components/icon/` |
| Kind of thing (to-do, journal, person, place...) | `Shape` (`name`, `icon`) or `Row shape`. One shape per kind. The `add` shape is only for the add button |
| Kinds: which shape and icon each kind has | `KIND_ICON`, `typeLook(type)`, `folderLook(folder)`, `kindLook(kind)` in `lib/notes/kinds.ts`. Spread the result into `Row` (`shape`, `icon`) or `Shape`. Add a new kind there, with its `--shape-kind-<kind>` token. Two kinds never share a shape |
| Add button and its quick add | `AddPanel` in `TabBar` |
| Tappable line | `Row` (`title`, `sub`, `icon`, `end`, `variant`, `chevron`, `href` or `onClick`) |
| Group of rows | `List` (`outlined` on a screen, `plain` for to-do lines, `ghost` in a sheet, `menu` for a sheet menu). It draws a `<ul>` and wraps each child in an `<li>`. Rows never draw `<li>` |
| Line between menu groups | `Divider` inside `List variant="menu"` |
| Tag, count, removable value | `Chip` (`label`, `variant` `tag`/`check`/`accent`, `icon`, `areas`, `onClick`, `onRemove`) |
| Row of chips | `Chips` from `components/chip/` around `Chip`s |
| Screen header | `PageHeader` (`title`, `kicker`, `fallback` or `onBack`, `action`, `areas`) |
| Group header with a count | `SectionHeader` (`title`, `count`, `tone`, `action`) |
| Notice with one action | `Banner` (`message`, `count`, `actionLabel`, `onAction`) |
| Sheet | `openSheet()`, `confirmSheet()`. Both draw `Sheet` from `components/sheet/` |
| Sheet menu, with steps | `OptionsMenu` (`options`, `open`, `onOpenChange`) |
| Pick one from a list | `Select` |
| Short message after an action | `toast()` from `components/toast/toast-store.ts`. It draws `Toast` |
| Sheet top | `SheetHead` (`title`, `context`, `quote`, `onBack`) |
| Sheet buttons | `SheetActions`, primary last |
| Type a value | `TextField` (`label`, `multiline`, `onEnter`) |
| Search | `SearchInput` |
| Pick a note, person or tag | `SearchList` (`items`, `onPick`, `onAdd`) |
| Pick in another sheet | `PickField` |
| Pick a day in a field | `DateField` (`label`, `value`, `onChange`, `min`, `max`, `yearSteps`) |
| Pick a note or tag in a sheet | `noteSheet()`, `tagSheet()` from `components/pick-sheet/` |
| Ask for a person, birthday or subject | `personSheet()`, `birthdaySheet()`, `subjectSheet()` |
| Change a to-do or sort a capture | `todoSheet()`, `inboxSheet()` |
| Suggest a note while typing `@` or `#` | `MentionDrawer` with `useMentions()` |
| Subject summary on a note | `SubjectCard` from `components/card/` |
| Draw note text | `Markdown` (`src`, `path`) |
| A person named in text (`@Name`, green) | `Mention` (`name`, `href`) |
| Pull down to refresh | `Pull` (`onRefresh`) |
| Sync state line | `SyncLine` |
| Bottom tabs | `TabBar` |
| Say when | `WhenPicker` (`choices`, `onPick`, `onNotTodo`) |
| Pick a day only | `Calendar` (`today`, `value`, `min`, `max`, `yearSteps`, `onPick`) |
| Long text | `Composer` from `components/field/` |
| Load a text file | `FilePicker` |
| Label on a group | `SectionHeader`. A field or fact label keeps its own label style in its part |
| Padded box | `Panel` |
| Fact on a note | `Fact`, `AddFact` |
| To-do line | `TodoRow` (`title`, `tag`, `when`, `checked`, `onCheckedChange`, `onOpen`, `onMenu`, `onLater` for the swipe-left Tomorrow). For a `TodoRef` from `makeTodo()`, use `TodoRefRow` (`done` for a ticked one: a tap opens Mark not done, Edit, Delete; `tickNow` ticks at once) |
| When a to-do is due | `WhenChip` (`label`, `status`) |
| A goal's target or step, with its tick box | `GoalStep` from `components/goal-step/` |
| A goal's big percent, bar and "+N this month" | `GoalBar` from `components/goal-bar/` |
| A subgoal: its name and small bar, as a link | `SubgoalLink` from `components/subgoal-link/` |
| Nothing to show | `Empty` (`title`, `body`, `size`) |

## Variants

- Change a look with a prop, never a second part or a one-off class.
- `size`: `sm`, `md`, `lg` (default `md`). `variant`: `primary` (`--background-accent`), `secondary` (`--background-accent-soft`), `outlined` (`--border-primary` border), `ghost` (text only), `danger` (outlined, `--text-danger` text). No other names.
- CSS for a variant is a class named for the value (`.primary`), set with `clsx`. The base class holds what variants share.
- A part takes data (`title`, `sub`, `icon`, `end`) and draws its own layout. Callers do not pass hand-built markup.

## Look

- Type comes from a role, never a raw `--font-size-*`. Set all three: `font-size: var(--type-<role>-size)`, `line-height: var(--type-<role>-leading)`, `font-weight: var(--type-<role>-weight)`. The same role looks the same everywhere. Add a role in `app/tokens/semantic.ts` before you add a one-off size.
- Spacing for screens, headers, rows, chips and buttons comes from the `--space-*` roles below. Every row uses the row padding. Touch targets stay at least 44px tall.
- Sizes, colours, spacing and radius come from the tokens in `app/tokens/design-tokens.css`. Add a token to `app/tokens/*.ts` if none fits. No raw `px` or hex in any `*.module.css` or in `src/styles/global.css`. Stylelint blocks both.
- Any group of items is a `List` of rows. Dividers come only from `List` or `Divider`. A row never draws its own border or box.
- Sheet menus: no line inside a group, a `Divider` between groups. Archive, delete and cancel are last, `variant="danger"`.
- A box is one step off what it sits on: `--background-secondary` on a screen, `--background-primary` in a sheet.
- Icons: import the Phosphor `…Icon` part and pass it (`<Icon icon={PlusIcon} />`). Type props with `type Icon as PhosphorIcon`. No icon name strings. One meaning, one glyph.
- A chevron means "opens a next step". Back is an arrow, top left. Close is ×, top right of a sheet. The primary action is last and full width. Other actions are `outlined`.
- One surface at a time. Never stack a sheet on a sheet.
- Dates: `longDate()`, `niceDate()` from `lib/notes/model.ts`, `quickDays()` from `lib/notes/due.ts`. Note-type lists and icons live in `lib/notes/`.
- Hover: write `:hover`, then undo it in a local `@media (hover: none)` below. No shared hover helper.
- No `text-transform: uppercase`. Values that change all the time go on the element `style`, not a CSS rule.

## Type roles

Atkinson is the body font, Hedvig the title font, Space Mono the number font.

| Role | Size | Line height | Weight | Font | Used for |
| --- | --- | --- | --- | --- | --- |
| `title-page` | 34px | 1.1 | 400 | Hedvig | `PageHeader` title |
| `title-note` | 28px | 1.1 | 400 | Hedvig | Note title, builder question |
| `title-section` | 21px | 1.25 | 400 | Hedvig | `SectionHeader`, sheet titles, card title, `Empty` title, markdown `h2` |
| `title-item` | 18px | 1.25 | 400 | Hedvig | Goal name, bar label, calendar month, markdown `h3` |
| `body` | 15px | 1.35 | 400 | Atkinson | Row and to-do titles, inputs, banner, timeline text |
| `reading` | 15px | 1.55 | 400 | Atkinson | Note text (`Markdown`), `Composer` |
| `action` | 15px | 1.25 | 600 | Atkinson | `Button` |
| `action-sm` | 14px | 1.25 | 600 | Atkinson | Small `Button`, swipe action |
| `nav` | 14px | 1.25 | 500 | Atkinson | `ViewTabs`, rail links |
| `secondary` | 14px | 1.35 | 400 | Atkinson | Row sub, kicker, hints, sheet description |
| `label` | 13px | 1.25 | 500 | Atkinson | `Chip`, `WhenChip`, to-do meta, field and fact labels, row end |
| `caption` | 12px | 1.25 | 400 | Atkinson | `SyncLine`, `Pull`, input hint |
| `tab` | 12px | 1.1 | 600 | Atkinson | `TabBar` labels, add panel labels, tool bar |
| `number-big` | 40px | 1.1 | 700 | Space Mono | `GoalBar` percent |
| `number` | 13px | 1.25 | 400 | Space Mono | Counts, calendar days |

## Spacing roles

| Token | Value | Used for |
| --- | --- | --- |
| `--space-screen-x` | 16px | Screen side padding, page header sides |
| `--space-header-top` | 24px | Above the page header |
| `--space-header-bottom` | 8px | Below the page header |
| `--space-section-top` | 16px | Above a `SectionHeader` |
| `--space-section-bottom` | 8px | Below a `SectionHeader` |
| `--space-row-x` / `--space-row-y` | 16px / 8px | `Row` and `TodoRow` padding |
| `--space-row-gap` | 12px | Icon or tick to text in a row |
| `--space-row-min` | 52px | `Row` minimum height |
| `--space-chip-x` / `--space-chip-y` | 8px / 2px | `Chip` padding |
| `--space-button-x` / `--space-button-sm-x` | 16px / 12px | `Button` side padding |
| `--space-stack` | 8px | Gap between groups in a list screen |

## Naming

- Files and folders kebab-case (`todo-row/todo-row.tsx`). Components PascalCase. Sheet openers camelCase ending in `Sheet` (`todoSheet()`).
- A folder is named after its main part. Sheet step files start with the sheet name (`todo-menu.tsx`).
- Class names are camelCase in the part's CSS Module (`.todoDue`). States start with `is` (`.isLate`). Variants are the value (`.primary`).
- Props say what they hold. Events start with `on`.

## Words on screen

- Every word, `aria-label`, placeholder and toast lives in `src/content/*.ts`. Import `copy` from `@/content/index.ts`.
- Words with a slot are a function with a template string: `remove: (name: string) => \`Remove ${name}\``. Call it: `copy.common.remove(name)`.
- Pick the file by where the words show. Shared words go in `common.ts`. Reuse a key first. Keys are camelCase (`chooseDay`).
- Use only the "Words the owner sees" in `AGENTS.md`. Buttons are verbs. Short toasts. Canadian spelling.
