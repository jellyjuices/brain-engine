---
description: Core rules for the phone app and Worker in app/ and worker/ (gates, layout, app flow, React, code style).
paths:
  - "app/**"
  - "worker/**"
---

# Web app

Stack: Vite, React 19, TypeScript, CSS Modules on the design tokens, Storybook, Vitest (happy-dom, Testing Library), a Cloudflare Worker. Parts, styles and words: `web-ui.md`. Tests: `web-tests.md`. To review a change, use the `web-reviewer` agent.

## Gates

Run `npm run gates` from the repo root before you finish. All must pass.

- `npm run size` fails on any file over 200 lines. Split the file. Never raise the limit. Some old files are still over. If you touch one, split it, or at least do not make it longer.
- Tests: `npm run test:app -- test/<file>.test.tsx`, only for files you added or changed.
- A failure in a file you did not touch is likely another agent's work. Say so in one line. Do not fix or revert it.
- Check routine code with typecheck, lint and tests, not screenshots. Reason: each image stays in the chat and is read again on every call.
- Never run a headless browser (Puppeteer, Playwright, headless Chrome) or start a dev server or Storybook from Bash. Exception: when the owner works from their phone, follow [phone-preview.md](phone-preview.md).
- No screenshots. For a design request, build the proposal as Storybook stories in `app/src/mocks/<topic>.stories.tsx`, from the real parts in `components/` and `shell/`. Keep the current look and feel; change only what the proposal is about. The owner runs Storybook and tests the stories by hand. Reason: a story can be tapped and typed into; a picture cannot.
- A mock story is a sandbox, not product code. It may use fake data and no-op handlers. Delete it once the owner approves or drops the design.
- Do not deploy (see `AGENTS.md`). Build, then tell the owner what to run.

## Layout of `app/src`

| Folder | Holds |
| --- | --- |
| `lib/` | Logic with no React: `notes/`, `storage/`, `sync/`, `lock/`, `platform/`, `design/`, `search/` |
| `hooks/` | Hooks that read the stores, and general hooks |
| `components/<part>/` | Shared parts, each with its `.tsx` files and one `<part>.module.css` |
| `screens/<screen>/` | One folder per screen, with its own parts and CSS Modules |
| `flows/` | Glue between parts and logic |
| `shell/` | App frame, screen list, screen host |
| `styles/` | `global.css`, the one global stylesheet |

`test/` mirrors `src/`.

- Import across folders with `@/` (`@/lib/notes/model.ts`). Use `./` only inside one folder.
- A screen never imports another screen. Move the shared part to `components/`.
- Logic goes in `lib/`. A component only draws and handles events.
- Every storage key lives in `lib/storage/keys.ts`, which imports nothing.
- A hook with no feature words in its name or arguments goes in `hooks/`, even with one caller. A hook that knows one part's state stays in that part's folder.

## How the app runs

- `main.ts` shows the lock screen first. Once unlocked, `shell/app.tsx` draws the tab bar and one screen.
- `shell/screens.ts` lists screens and routes. Read the route with `useRoute()`. Move with `go()`, `navigate()`, `back()` from `lib/platform/router.ts`.
- A tap that asks a question opens a sheet: `openSheet<T>()` resolves with the answer, or `null` on close. Multi-step sheets keep a `step` state and draw one step part per file.
- A flow in `flows/` opens the sheet, then calls `lib/` to write. The component only calls the flow.
- Save with `saveFlow(write, doneWords)` from `flows/save-flow.ts`. `write` queues one item with `lib/sync/writes.ts`. `saveFlow` sends it, syncs, and shows the toast. Do not call `flush()` and `toast()` by hand.

## React

- One component per file.
- Named exports only. Reason: a default export lets each importer pick a name, so one part gets two names. The one exception is the Worker entry, which Cloudflare needs as a default export.
- Read stores through `src/hooks/`. Do not subscribe by hand in a component.
- Sheets: `openSheet()` from `components/sheet/open-sheet.tsx`. Toasts: `toast()` from `components/toast/toast-store.ts`. Class lists: `clsx`.
- Do not set state in an effect when you can work the value out during render.

## Code

- **No comments.** A good name says what the code does. The one exception is a tool directive, such as `// @vitest-environment`.
- `function` declarations, not `const` arrows. Arrows only for inline callbacks. oxlint `func-style` enforces it.
- No alias functions (a body that only returns another call). Inline one-line functions unless the name adds meaning.
- One home for each list, key or constant. Import it. Do not copy it.
- Do not memoize a failed IndexedDB open. Reason: nothing recovers without a reload.
- Keep `strict` and `noUncheckedIndexedAccess`. No `any`, no `@ts-ignore`.
- Before a new part or browser code, check the current platform feature (`<dialog>`, `popover`, View Transitions, container queries). Do not add a library for what the browser does.
