---
name: design-mock
description: Proposes a UX or UI change in brain-engine as Storybook mock stories built from the real parts, then runs feedback rounds with the owner. Use when the owner asks to propose a flow, mock something up or show options, or brings a UX problem to look into before building. Not for building the approved design: use build-ui.
---

# Design mock

The owner tests a mock by hand in Storybook. A mock is a sandbox, not product code. It lives in `app/src/mocks/` and is deleted once the owner approves or drops it.

## Steps

1. Read `.claude/rules/web-ui.md` (the parts table, Experience and Words on screen) and the intent doc for the area in `docs/intent/`.
2. Read the real screen and parts the idea touches. Name what exists today in one line each. Reason: the owner rejects any mock that redraws a crafted part.
3. Find the slot the idea fits into: an existing sheet, step, toast, drawer or row. Never redraw a tuned part.
4. Build one story per idea in `app/src/mocks/<topic>.stories.tsx`. Label them `A1`, `A2`, `B1` so the owner can answer per story.
5. Use only real parts from `components/` and `shell/`. Fake data and no-op handlers are fine. Real-looking names and dates, never "foo".
6. Frame each story like the real screen it sits in: the same shell, layout and spacing.
7. Run `npm run typecheck`, `npm run lint` and `npm run format:check`. Fix what fails.
8. Tell the owner the story names and one line each on what to try. Then stop.

## Rules

- Never start Storybook, a dev server or a headless browser. Never take screenshots. The owner runs `npm run storybook` and looks.
- If the owner sends a screenshot, read it for what is wrong. Fix the cause in the part, not only in the mock.
- Feedback is per story. Change only the story named, and say in one line what changed.
- When feedback teaches a general rule, add it to Experience or Words on screen in `web-ui.md`. One line.
- If a mock needs a new prop or variant on a real part, add it to the real part with a test. Never fork the part inside `mocks/`.
- Words follow Words on screen in `web-ui.md`: action first, the real name, one verb per flow, no reasons the owner did not ask for.

## When the owner approves

1. Write the summary: one bullet per story, plain words, what the owner sees and taps. No code.
2. Hand over to the `build-ui` skill. It writes the spec in `docs/design/<topic>-spec.md` from the stories before it deletes them.
3. The owner deletes `app/src/mocks/` or tells you to. `rm` is blocked for agents in `.claude/settings.json`.

## Before you stop

- [ ] Every story uses real parts and keeps the current look.
- [ ] Stories are labelled and listed for the owner.
- [ ] Typecheck, lint and format pass.
- [ ] No screenshots, no Storybook started.
