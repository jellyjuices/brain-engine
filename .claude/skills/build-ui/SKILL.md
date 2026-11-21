---
name: build-ui
description: Builds or fixes app UI in brain-engine so it works in the real app, from an approved mock, a spec, or UI feedback. Use when asked to implement mocks, build a screen or part, fix how something looks or behaves on screen, or make the UI consistent, or for any change under app/src/components, screens, shell or tokens.
---

# Build UI

A UI change is done when it works in context on every screen that shows it, and the owner has looked at it on a small screen. Tests do not see motion, layout or click-away.

## Steps

1. Read `.claude/rules/web.md`, `web-ui.md` and `design-system.md`. For the Add panel, also `docs/design/add-panel-behaviours.md`.
2. From a mock: write `docs/design/<topic>-spec.md` first. Per story: where it shows, what the owner taps, what is sent, the words. Then build from the spec, not from the mock file.
3. Find every place the change shows. Use fallow `trace_export` or `symbol_impact` on the part.
4. Fix at the lowest layer that owns the value:
   - Wrong everywhere: the part's CSS Module, or a token if many parts share it.
   - Wrong on one screen: that screen's CSS Module.
   - Find which layer already sets a value before you add it again.
5. Pick parts from the table in `web-ui.md`. Close fit: add a prop or variant. New part only if nothing fits, then add a row to the table.
6. Words go in `src/content/`. Logic goes in `lib/`. The flow goes in `flows/`. The component only draws and calls the flow.
7. Add or change tests with the `write-tests` skill. A feature that breaks an old test on purpose: build the feature, skip the old test and add it to step E5 in `docs/plan/roadmap.md`.
8. Run `npm run gates`. Then run the `web-reviewer` agent and fix its findings.
9. Tell the owner what changed and what to look at on a small screen, as a short list of taps.

## Rules

- Keep the crafted parts. Never redraw a tuned part to add a feature.
- One idea, one part, one size. If two parts do one job, merge them while you are there.
- No `px`, no hex, no pure black. Tokens or `color-mix()` on a role token. Never add a token for one use.
- Light and dark follow the device. Never add a theme switch or a check for the theme.
- A value goes in the part's CSS or a token, never in a rule doc. The code is the source of truth for values.
- Rewrite, don't bridge. When moving to a new part or style, map old to new and delete the old in the same change. No transition layer.
- Never start a dev server, Storybook or a headless browser. Phone preview mode is the one exception: `.claude/rules/phone-preview.md`.
- Before you claim the app runs, run `npm run build`.

## Before you stop

- [ ] Every screen that shows the part is fixed, not only the one named.
- [ ] Spec written for a mock build. Mock files listed for the owner to delete.
- [ ] `npm run gates` exits 0. `web-reviewer` has no findings left.
- [ ] Committed by path. The owner has a list of what to check on a small screen.
