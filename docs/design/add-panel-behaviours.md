# Add button, Add panel and inputs: behaviours on main

Check list for hand-testing later slices. Paths are under `app/src/components/`. Keyframes are scoped by the CSS Module; `add-panel.tsx` reads the scoped `add-deflate` name from the module.

## Animations (keyframes name, owner)

- Blob inflates on open: `add-inflate`, pop, ease. `add-panel/add-panel.module.css`
- Todo and journal blobs morph: `add-morph`, pop, ease. `add-panel/add-panel.module.css`
- Blob outline spins forever: `add-spin`, 40s linear, not on journal. `add-panel/add-panel.module.css`
- Blob shrinks on close: `add-deflate`, fast, ease-in; its `animationend` calls `closed()`. `add-panel/add-panel.module.css`, `add-panel.tsx`
- Scrim fades on close: `add-fade`, fast, ease-in. `add-panel/add-panel.module.css`
- Kind buttons pop in: `add-arc-pop`, fast, ease. `add-menu/add-menu.module.css`
- Kind shapes spin: `add-arc-spin`, 40s linear. `add-menu/add-menu.module.css`
- Journal text edges fade while scrolling: `add-edges` plus `@property --add-fade-top/bottom`. `add-input/add-input.module.css`
- Blob moves and resizes on full-screen toggle: transition on top, width, height, margin-left, slow. `add-panel/add-panel.module.css`

## Tool bar (to-do and journal)

- A tool bar sits under the open box: Bold, Italic, List (journal only), Tag, Mention, and Full screen (journal only) at the end. `add-panel/add-toolbar.tsx`
- It is pinned to the bottom of the visual viewport, right above the tab bar: `--vvt` + `--vvh` - `--size-tabbar` - safe area. With the on-screen keyboard up, it sits on the keyboard. `add-panel/add-toolbar.module.css`
- The text box ends above the tool bar (`--add-tools`), so it never covers the line being typed. Full screen ends there too. `add-input/add-input.module.css`
- Bold and Italic wrap the selection in `**` or `_`; tapped again on a wrapped selection they unwrap. With no selection they put the marks at the caret, caret inside. `lib/notes/markers.ts`
- List adds `- ` to each selected line, or takes it off when every line has it.
- Tag and Mention put `#` or `@` at the caret (a space first after a word) and open the suggestions. A selected word becomes the search.
- Typing `@` or `#` opens the same suggestions, as on the full Add screen (`MentionSuggestions`, `useMentions`). They show right above the tool bar.
- A pick writes what the full Add screen writes: a person or subject's name; for a to-do a date sets the When word, for a journal it writes the date. A tag stays in the text as `#tag`; on a to-do save it moves into the to-do's tags.
- Tool taps keep the keyboard up: the bar cancels `pointerdown` and `mousedown`, and each tool puts the focus and caret back in the box.
- Tool taps never close the panel: the bar sits above the scrim.
- Escape with suggestions open closes only the suggestions. Escape again closes the panel.
- The bar has no animation of its own, so reduced motion needs nothing more.

## Rotations and scale

- Plus turns 45 degrees into a cross when open (`.addPanel.isOpen .addMain > :first-child > svg`), no turn while closing. `add-panel/add-panel.module.css`
- Plus button squashes to 0.94 on press. `add-panel/add-panel.module.css`
- Blob outline rotates 1 turn per 40s. `add-panel/add-panel.module.css`
- Kind positions: three buttons on an arc. `add-menu/add-menu.module.css`

## States

- Panel classes: `isClosed`, `isOpen`, `isClosing`, plus `data-mode` (`closed`, `open`, `todo`, `journal`) that the tab bar reads. `add-panel/add-panel.tsx`
- Label "Add" hidden whenever not closed. `add-panel/add-panel.module.css`
- Button label becomes Save when editing, Close when open. `add-panel/add-panel.tsx`
- Blob shapes: add (cookie), todo (scallop), journal (house). `add-panel/add-panel.module.css`
- Journal blob is 120vw; full screen makes it fill the height. `add-panel/add-panel.module.css`

## Click-away and keyboard

- Scrim click closes. `add-panel/add-panel.tsx`
- Escape closes, while open or editing. `add-panel/add-panel.tsx`
- Closing blurs the text box, then waits for `add-deflate` to end. `add-panel/add-panel.tsx`
- Tap on button: closed opens kinds, open closes, editing saves (empty text closes). `add-panel/add-panel.tsx`
- Saving disables the button (`aria-busy`). `add-panel/add-panel.tsx`
- "Other" kind closes and goes to `/add`. `add-panel/use-add-panel.ts`
- With an on-screen keyboard, the tab bar hides unless todo or journal is open (`[data-keyboard]`). `shell/tab-bar/tab-bar.module.css`

## Hold and drag

- Hold 400ms on the Add button opens the kinds. `add-panel/use-hold-to-pick.ts`
- Drag to a kind and let go picks it. `add-panel/use-hold-to-pick.ts`
- Let go outside every kind, or on Add itself, closes. `add-panel/use-hold-to-pick.ts`
- The click after a hold is swallowed (`takeClick`); long-press menu and touch callout are off. `add-panel/use-hold-to-pick.ts`, `add-panel.module.css`

## Text inputs

- Todo and journal boxes are `contentEditable="plaintext-only"` with placeholder from `data-placeholder`. `add-input/add-input.tsx`
- Box takes focus on the next frame after opening. `add-panel/add-panel.tsx`
- Full-screen toggle (journal only), at the end of the tool bar, keeps the caret in view after the transition. `add-panel/add-expand-button.tsx`, `add-panel.tsx`
- Fields use border focus colour, no outline offset. `field/field.module.css`
- Search input has no native clear button; own clear button. `field/field.module.css`
- Composer textarea has no outline on focus. `field/field.module.css`
- Sheet inputs use the page background. `field/field.module.css`

## Reduced motion

- Spin on blob outline and kind shapes stops. `add-panel.module.css`, `add-menu.module.css`
- Durations go to 0ms through tokens and a global rule. `styles/global.css`, the tokens

## Wide screens

- Add sits at the top of the rail as a row with a label. `add-panel/add-panel.module.css (`layout="rail"`)`
