# One system: old to new

The app moves to one token set (`app/tokens/design-tokens.css`) and one part per idea. Styles go in `<part>.module.css` next to the part. `app/src/styles/tokens.css` is gone. Every part, screen and shell piece is a CSS Module on these tokens. The one global file is `app/src/styles/global.css`.

## Colour

| Old                             | New                        | Note                                |
| ------------------------------- | -------------------------- | ----------------------------------- |
| `--bg`                          | `--background-primary`     |                                     |
| `--surface`                     | `--background-secondary`   |                                     |
| `--ink`                         | `--text-primary`           |                                     |
| `--muted`                       | `--text-secondary`         |                                     |
| `--line`                        | `--border-primary`         |                                     |
| `--accent` (fill)               | `--background-accent`      |                                     |
| `--accent` (text, border, icon) | `--text-accent`            |                                     |
| `--accent-ink`                  | `--text-on-accent`         |                                     |
| `--accent-soft`                 | `--background-accent-soft` |                                     |
| `--danger`                      | `--text-danger`            |                                     |
| `--danger-soft`                 | `--toast-error`            | nearest; only the old toast used it |
| `--warn`                        | `--status-late`            |                                     |
| `--warn-soft`                   | `--background-check`       | nearest                             |
| `--scrim`                       | `--background-scrim`       |                                     |
| `--shadow`                      | `--shadow-raised`          |                                     |
| `--shadow-sm`                   | `--shadow-sm-light`        | nearest                             |

## Font

| Old                       | New                       | Note                |
| ------------------------- | ------------------------- | ------------------- |
| `--font-body`             | `--font-body`             | same name, new face |
| `--font-display`          | `--font-display`          | same name, new face |
| `--font-serif`            | `--font-display`          | nearest             |
| `--t-xs` (13px)           | `--font-size-body-xs`     | nearest             |
| `--t-sm` (14px)           | `--font-size-body-sm`     |                     |
| `--t-md`, `--text` (17px) | `--font-size-body-md`     |                     |
| `--t-lg` (20px)           | `--font-size-body-lg`     | nearest             |
| `--t-xl` (24px)           | `--font-size-body-xl`     | nearest             |
| `--t-2xl` (34px)          | `--font-size-display-xl`  | nearest             |
| `--t-display` (56px)      | `--font-size-display-3xl` | nearest             |
| `--leading`               | `--font-leading-normal`   |                     |
| `font-weight: 600`        | `--font-weight-semibold`  |                     |

## Space

| Old             | New           | Note    |
| --------------- | ------------- | ------- |
| `--s0` (4px)    | `--space-xs`  |         |
| `--s1` (8px)    | `--space-sm`  |         |
| `--s1-5` (12px) | `--space-md`  |         |
| `--s2` (16px)   | `--space-lg`  |         |
| `--s3` (24px)   | `--space-xl`  |         |
| `--s4` (32px)   | `--space-2xl` |         |
| `--s5` (40px)   | `--space-3xl` | nearest |
| `--s6` (48px)   | `--space-3xl` |         |

## Radius

| Old                  | New             | Note                |
| -------------------- | --------------- | ------------------- |
| `--radius-sm` (6px)  | `--radius-sm`   | same name, now 8px  |
| `--radius` (14px)    | `--radius-md`   |                     |
| `--radius-lg` (20px) | `--radius-lg`   | same name, now 16px |
| `--radius-xl` (56px) | `--radius-full` | nearest             |
| `--pill`             | `--radius-full` |                     |

## Size

| Old                        | New                    | Note    |
| -------------------------- | ---------------------- | ------- |
| `--touch` (48px)           | `--size-target`        | nearest |
| `--control` (44px)         | `--size-control`       |         |
| `--control-sm` (36px)      | `--size-control-sm`    | added   |
| `--row` (56px)             | `--size-plus`          | nearest |
| `--icon-xs` (14px)         | `--size-icon-sm`       | nearest |
| `--icon-sm` (16px)         | `--size-icon-sm`       | nearest |
| `--icon` (20px)            | `--size-icon`          | nearest |
| `--icon-lg` (24px)         | `--size-icon`          | nearest |
| `--icon-xl` (48px)         | `--size-target`        | nearest |
| `--badge` (16px)           | `--size-icon-sm`       |         |
| `--dot` (8px)              | `--size-dot`           | nearest |
| `--tabbar`                 | `--size-tabbar`        |         |
| `--rail` (240px)           | `--size-glow`          | nearest |
| `--tile` (64px)            | `--size-tabbar`        | nearest |
| `--shape-lg` (52px)        | `--size-plus`          | nearest |
| `--add-arc` (120px)        | `--size-ring`          | nearest |
| `--add-blob` (520px)       | `--size-blob`          | added   |
| `--handle-w` (36px)        | `--size-handle`        | nearest |
| `--handle-h`               | `--size-handle-height` |         |
| `--hair`                   | `--size-hair`          |         |
| `--ring` (2px)             | `--size-focus`         |         |
| `--bar` (3px)              | `--size-focus`         | nearest |
| `--underline-offset` (3px) | `--space-2xs`          | nearest |
| `--shake` (8px)            | `--space-sm`           | nearest |
| `--field-min` (200px)      | `--size-menu-min`      | nearest |
| `--w-xs` (260px)           | `--size-glow`          | nearest |
| `--w-sm` (360px)           | `--size-max-width`     | nearest |
| `--w-md` (480px)           | `--size-max-width`     | nearest |
| `--w-lg` (560px)           | `--size-max-width`     | nearest |

## Shape

| Old                                   | New            | Note |
| ------------------------------------- | -------------- | ---- |
| `--shape-cookie` ... `--shape-circle` | same names     |      |
| `--shape-kind-*`                      | same names     |      |
| `--shape-kind-add`                    | `--shape-plus` |      |

## Motion

| Old             | New                      | Note            |
| --------------- | ------------------------ | --------------- |
| `--ease`        | `--motion-easing`        |                 |
| `--ease-in`     | `--motion-easing-in`     | added           |
| `--fast`        | `--motion-fast`          |                 |
| `--slow`        | `--motion-slow`          |                 |
| `--pop` (460ms) | `--motion-pop`           | nearest (600ms) |
| `--spin` (40s)  | `--motion-duration-spin` | added           |

## Z-index

Neither set has z-index tokens. Raw numbers stay as they are.

## Added to `app/tokens/primitives.ts`

`--size-control-sm` (36px), `--size-blob` (520px), `--motion-easing-in`, `--motion-duration-spin` (40s). Nothing in the new set comes near these.

## Parts

| Idea                     | Stays                                                                                                | Goes                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| To-do line               | `todo-row` (was `todo-row-next`)                                                                     | old `todo-row`                                                                             |
| Toast                    | `toast` (view from `toast-next`; `toast()` and `Toasts` stay)                                        | old `toast-card` and `toast.css`                                                           |
| Chip                     | `chip` (was `chip-next`)                                                                             | old `chip`                                                                                 |
| Date field               | `date-field` (was `date-field-next`)                                                                 | old `date-field`                                                                           |
| Sheet                    | `sheet` (frame from `sheet-next`; `openSheet()`, `confirmSheet()`, `SheetHead`, `SheetActions` stay) | old sheet frame and `sheet.css`                                                            |
| Screen header            | `PageHeader` (gains `fallback`, `onBack`)                                                            | `ScreenHead`                                                                               |
| Goal percent and bar     | `GoalBar`                                                                                            | `GoalProgress`                                                                             |
| Icon-only button         | `IconButton` in `icon-button/`                                                                       | `IconButton` in `button/`                                                                  |
| Calendar                 | `Calendar`                                                                                           | `DayPicker`                                                                                |
| Sheet menu               | `OptionsMenu`                                                                                        | `Menu` (drop-down)                                                                         |
| Notice line              | `Banner`                                                                                             | `UnsortedBanner` draws `Banner`                                                            |
| Group header on a screen | `SectionHeader`                                                                                      | `.section-label` on screen groups (field and fact labels keep a label style in their part) |
| Add button and tab bar   | `AddPanel` in `shell/tab-bar`                                                                        | `PlusButton` and `components/tab-bar` (no callers)                                         |
| Sheet menu items         | `OptionsMenu`                                                                                        | `List variant="menu"` in `todo-menu`, `inbox-menu`; `Option` in `sheet/option.tsx` is gone |
| Pick one                 | `Select`                                                                                             | nothing old                                                                                |
