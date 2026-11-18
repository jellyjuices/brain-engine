---
description: How design system styles are written (CSS Modules and the design tokens).
paths:
  - "app/src/components/**"
  - "app/tokens/**"
---

# Design system styles

- Each part keeps its styles in one CSS Module next to it: `<part>.module.css`, imported as `import styles from "./<part>.module.css"`. Vite only treats `*.module.css` as a module.
- Tokens live in `app/tokens/*.ts`: `primitives.ts` for raw values, `semantic.ts` for colour roles with a light and a dark value. `npm run tokens` builds `app/tokens/design-tokens.css`. Never edit the CSS by hand.
- A token is shared by many parts. Colour, font, space, radius, shapes, control size, layout and motion only. A value for one part stays in that part's CSS.
- Light and dark follow the device through one `prefers-color-scheme` query in the built CSS. There is no theme switch.
- `npm run contrast` checks every colour pair. Add a pair to `contrastPairs` in `semantic.ts` when you add a colour role.
- Variants and states are classes in the module (`styles[variant]`, `styles.isDone`), set with `clsx`. Style a third-party part's classes with `:global(.name)` under a module class.
- Name keyframes inside the module; CSS Modules scope them.
- Run-time values are CSS variables set on the element `style`.
- CSS Modules on the new tokens are the only way to style. No `css` tagged templates, no `*.styles.ts`, no plain per-part `.css`. The one global file is `app/src/styles/global.css` (reset, `html`, `body`, fonts, `:focus-visible`, reduced motion).
- `func-style` and three jsx-a11y rules are off for some parts (see `overrides` in `app/.oxlintrc.json`). Remove a folder from that list when you move it to function declarations.
