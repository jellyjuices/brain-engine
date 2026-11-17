---
description: How design system styles are written (Linaria).
paths:
  - "web/design-system/src/**"
---

# Design system styles

- Styles are Linaria `css` blocks in the component file, real CSS with tokens only. Variants are objects of `css` classes; cross-part rules use the exported class (`.${other}`), `&` nesting, `data-*` and `aria-*`.
- A component file past 200 lines moves its blocks to `<name>.styles.ts` beside it, with named exports.
- Plain CSS stays only in `src/styles/tokens.css` (generated) and `src/styles/base.css` (resets, fonts). Run-time values are CSS variables set on the element.
- Apps import from `src/index.ts`; styles come with each component. The app's Vite and Vitest config need `@wyw-in-js/vite`.
