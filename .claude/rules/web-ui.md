---
description: Design system, naming, styles and on-screen words for the web app parts and screens.
paths:
  - "web/app/src/components/**"
  - "web/app/src/screens/**"
  - "web/app/src/shell/**"
  - "web/app/src/styles/**"
  - "web/app/src/content/**"
---

# Web app UI

The app must look like one app: one idea, one part, one size, one word. If you find two parts for one idea, merge them when you touch them, or at least add no copy.

## Before you build a part

1. Find it in the table. Use it.
2. If it is close, add a prop or variant to it.
3. Only if nothing fits, make `components/<part>/` with one `.css`, and add a row here.

If a screen part is needed in a second place, move it to `components/` first. Reason: copies are the main cause of drift.

| Idea | Use |
| --- | --- |
| Button | `Button` (`variant`, `size`, `icon`, `block`, `busy`) |
| Icon-only button | `IconButton` (always with `label`) |
| Icon | `Icon` from `components/icon/` |
| Kind of thing (to-do, journal, person, place...) | `Shape` (`name`, `icon`) or `Row shape`. One shape per kind. The `add` shape is only for the add button |
| Add button and its quick add | `AddPanel` in `TabBar` |
| Tappable line | `Row` (`title`, `sub`, `icon`, `end`, `variant`, `chevron`, `href` or `onClick`) |
| Group of rows | `List` (`outlined` on a screen, `ghost` in a sheet, `menu` for a sheet menu) |
| Line between menu groups | `Divider` inside `List variant="menu"` |
| Tag, count, removable value | `Chip` (`variant`, `size`, `onClick`, `onRemove`) |
| Quick choice in a grid | `Tile` inside `.tiles` |
| Screen header | `ScreenHead` (`title`, `kicker`, `fallback` or `onBack`, `action`) |
| Sheet | `openSheet()`, `confirmSheet()` |
| Sheet top | `SheetHead` (`title`, `context`, `quote`, `onBack`) |
| Sheet buttons | `SheetActions`, primary last |
| Type a value | `TextField` (`label`, `multiline`, `onEnter`) |
| Search | `SearchInput` |
| Pick a note, person or tag | `SearchList` (`items`, `onPick`, `onAdd`) |
| Pick in another sheet or calendar | `PickField`, `DateField` |
| Pick a note or tag in a sheet | `noteSheet()`, `tagSheet()` from `components/pick-sheet/` |
| Ask for a person, birthday or subject | `personSheet()`, `birthdaySheet()`, `subjectSheet()` |
| Change a to-do or sort a capture | `todoSheet()`, `inboxSheet()` |
| Suggest a note while typing `@` or `#` | `MentionDrawer` with `useMentions()` |
| Search result line | `HitRow` (`path`, `title`, `type`, `sub`) |
| Subject summary on a note | `SubjectCard` from `components/card/` |
| Draw note text | `Markdown` (`src`, `path`) |
| A person named in text (`@Name`, green) | `Mention` (`name`, `href`) |
| Pull down to refresh | `Pull` (`onRefresh`) |
| Sync state line | `SyncLine` |
| Bottom tabs | `TabBar` |
| Say when | `WhenPicker` (`choices`, `onPick`, `onNotTodo`) |
| Pick a day only | `DayPicker` |
| Long text | `<textarea className="composer">` |
| Load a text file | `FilePicker` |
| Label on a group | `.section-label` |
| Padded box | `Panel` |
| Fact on a note | `Fact`, `AddFact` |
| To-do line | `TodoRow`, with `makeTodo()` from `lib/notes/todos.ts` |
| A goal's target or step, with its tick box | `GoalStep` from `components/goal-step/` |
| A goal's big percent, bar and "+N this month" | `GoalBar` from `components/goal-bar/` |
| A subgoal: its name and small bar, as a link | `SubgoalLink` from `components/subgoal-link/` |
| Nothing to show | `Empty` (`title`, `body`, `size`) |

## Variants

- Change a look with a prop, never a second part or a one-off class.
- `size`: `sm`, `md`, `lg` (default `md`). `variant`: `primary` (main green `--accent`), `secondary` (light green `--accent-soft`), `outlined` (`--line` border), `ghost` (text only), `danger` (outlined, `--danger` text). No other names.
- CSS for a variant is `<part>--<value>`, set with `clsx`. The base class holds what variants share.
- A part takes data (`title`, `sub`, `icon`, `end`) and draws its own layout. Callers do not pass hand-built markup.

## Look

- Sizes, colours, spacing and radius come from tokens in `src/styles/tokens.css`. Add a token if none fits. No raw `px` or hex outside tokens. Stylelint blocks both outside `tokens.css`.
- Any group of items is a `List` of rows. Dividers come only from `List` or `Divider`. A row never draws its own border or box.
- Sheet menus: no line inside a group, a `Divider` between groups. Archive, delete and cancel are last, `variant="danger"`.
- A box is one step off what it sits on: `--surface` on a screen, `--bg` in a sheet.
- Icons: import the Phosphor `…Icon` part and pass it (`<Icon icon={PlusIcon} />`). Type props with `type Icon as PhosphorIcon`. No icon name strings. One meaning, one glyph.
- A chevron means "opens a next step". Back is an arrow, top left. Close is ×, top right of a sheet. The primary action is last and full width. Other actions are `outlined`.
- One surface at a time. Never stack a sheet on a sheet.
- Dates: `longDate()`, `niceDate()` from `lib/notes/model.ts`, `quickDays()` from `lib/notes/due.ts`. Note-type lists and icons live in `lib/notes/`.
- Hover: write `&:hover`, then undo it in a local `@media (hover: none)` below. No shared hover helper.
- No `text-transform: uppercase`. Values that change all the time go on the element `style`, not a CSS rule.

## Naming

- Files and folders kebab-case (`todo-row/todo-row.tsx`). Components PascalCase. Sheet openers camelCase ending in `Sheet` (`todoSheet()`).
- A folder is named after its main part. Sheet step files start with the sheet name (`todo-menu.tsx`).
- CSS classes start with the part name (`.todo-due`). States use `is-` (`.is-late`). Variants use `--`.
- Props say what they hold. Events start with `on`.

## Words on screen

- Every word, `aria-label`, placeholder and toast lives in `src/content/*.ts`. Import `copy` from `@/content/index.ts`.
- Words with a slot are a function with a template string: `remove: (name: string) => \`Remove ${name}\``. Call it: `copy.common.remove(name)`.
- Pick the file by where the words show. Shared words go in `common.ts`. Reuse a key first. Keys are camelCase (`chooseDay`).
- Use only the "Words the owner sees" in `AGENTS.md`. Buttons are verbs. Short toasts. Canadian spelling.
