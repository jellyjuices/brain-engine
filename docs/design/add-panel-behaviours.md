# Add button, Add panel and inputs: behaviours on main

Check list for hand-testing later slices. Paths are under `app/src/components/`. Old tokens: fast 160ms, slow 220ms, pop 460ms, spin 40s, ease `cubic-bezier(0.2,0.7,0.2,1)`, ease-in `cubic-bezier(0.5,0,0.75,0)`.

## Animations (keyframes name, owner)

- Blob inflates on open: `add-inflate`, pop, ease. `add-panel/add-panel.css`
- Todo and journal blobs morph: `add-morph`, pop, ease. `add-panel/add-panel.css`
- Blob outline spins forever: `add-spin`, 40s linear, not on journal. `add-panel/add-panel.css`
- Blob shrinks on close: `add-deflate`, fast, ease-in; its `animationend` calls `closed()`. `add-panel/add-panel.css`, `add-panel.tsx`
- Scrim fades on close: `add-fade`, fast, ease-in. `add-panel/add-panel.css`
- Kind buttons pop in: `add-arc-pop`, fast, ease. `add-arc/add-arc.css`
- Kind shapes spin: `add-arc-spin`, 40s linear. `add-arc/add-arc.css`
- Journal text edges fade while scrolling: `add-edges` plus `@property --add-fade-top/bottom`. `add-box/add-box.css`
- Blob moves and resizes on full-screen toggle: transition on top, width, height, margin-left, slow. `add-panel/add-panel.css`

## Rotations and scale

- Plus turns 45 degrees into a cross when open (`.add-panel.is-open .add-main .shape > svg`), no turn while closing. `add-panel/add-panel.css`
- Plus button squashes to 0.94 on press. `add-panel/add-panel.css`
- Blob outline rotates 1 turn per 40s. `add-panel/add-panel.css`
- Kind positions: three buttons on a 120px arc at -0.87/-0.5, 0/-1, 0.87/-0.5. `add-arc/add-arc.css`

## States

- Panel classes: `is-closed`, `is-open`, `is-todo`, `is-journal`, `is-closing`. `add-panel/add-panel.tsx`
- Label "Add" hidden whenever not closed. `add-panel/add-panel.css`
- Button label becomes Save when editing, Close when open. `add-panel/add-panel.tsx`
- Blob shapes: add (cookie), todo (scallop), journal (house). `add-panel/add-panel.css`
- Journal blob is 120vw; full screen makes it fill the height. `add-panel/add-panel.css`

## Click-away and keyboard

- Scrim click closes. `add-panel/add-panel.tsx`
- Escape closes, while open or editing. `add-panel/add-panel.tsx`
- Closing blurs the text box, then waits for `add-deflate` to end. `add-panel/add-panel.tsx`
- Tap on button: closed opens kinds, open closes, editing saves (empty text closes). `add-panel/add-panel.tsx`
- Saving disables the button (`aria-busy`). `add-panel/add-panel.tsx`
- "Other" kind closes and goes to `/new`. `add-panel/add-panel.tsx`
- On a phone keyboard, the tab bar hides unless todo or journal is open (`[data-keyboard]`). `shell/tab-bar/tab-bar.css`

## Hold and drag

- Hold 400ms on the Add button opens the kinds. `add-panel/use-hold-to-pick.ts`
- Drag to a kind and let go picks it. `add-panel/use-hold-to-pick.ts`
- Let go outside every kind, or on Add itself, closes. `add-panel/use-hold-to-pick.ts`
- The click after a hold is swallowed (`takeClick`); long-press menu and touch callout are off. `add-panel/use-hold-to-pick.ts`, `add-panel.css`

## Text inputs

- Todo and journal boxes are `contentEditable="plaintext-only"` with placeholder from `data-placeholder`. `add-box/add-box.tsx`
- Box takes focus on the next frame after opening. `add-panel/add-panel.tsx`
- Full-screen toggle (journal only) keeps the caret in view after the transition. `add-panel/add-full.tsx`, `add-panel.tsx`
- Fields use border focus colour, no outline offset. `field/field.css`
- Search input has no native clear button; own clear button. `field/field.css`
- Composer textarea has no outline on focus. `field/field.css`
- Sheet inputs use the page background. `field/field.css`

## Reduced motion

- Spin on blob outline and kind shapes stops. `add-panel.css`, `add-arc.css`
- Durations go to 0ms through tokens and a global rule. `styles/tokens.css`, `styles/base.css`

## Wide screens

- Add sits at the top of the rail as a row with a label. `shell/rail/rail.css`
