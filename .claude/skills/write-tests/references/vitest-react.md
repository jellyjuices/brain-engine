# Vitest and React (`web/app`, `design-system`)

Run: `npm --prefix web/app test` (all, about 40 s) or `npx vitest run test/<path>` from `web/app`. Config: `web/app/vite.config.ts` (happy-dom, `test/**/*.test.{ts,tsx}`, setup `test/setup.ts` loads `jest-dom`). No coverage tool is installed. `design-system` has no tests, only `typecheck`.

## Shape and place

- `web/app/test/<area>/<name>/<name>.test.tsx`, mirroring `src` (`components`, `screens`, `lib`, `flows`, `shared`).
- Import `describe, expect, it, vi` from `vitest`. Use `@/` for app source and `@shared/` for `shared/`.
- Pure logic: `.test.ts`. Anything that renders: `.test.tsx`.

## Helpers to reuse first (`web/app/test/helpers.ts`)

- `note(path, body, overrides)`: a made-up `StoredNote`.
- `fixture()`: a small set of notes. `NOW = "2026-11-05"`: the fixed date.
- `unlockTestVault()`: unlocks the vault with a test key.
- IndexedDB: `import "fake-indexeddb/auto"` at the top of any test that stores notes. Reset stores in `beforeEach`.

## Drive it like a user

- `render(...)`, then `const user = userEvent.setup()` and `await user.click(...)`, `await user.type(...)`.
- Query with `getByRole`, `getByLabelText`, `getByText` (and `findBy*` for async). A test id only when nothing else works.
- Text comes from `copy` in `@/content/index.ts`. Use it instead of retyping the string.
- Do not call a handler or prop directly. Do not use `fireEvent` when `userEvent` can do it. Pointer gestures with no `userEvent` equivalent (swipe) may use `fireEvent.pointer*`.
- Assert styles only when they show a state a user sees. Not colours or spacing.

## Time

`vi.useFakeTimers()` and `vi.setSystemTime(new Date("2026-11-05T09:00:00Z"))`, then `await vi.advanceTimersByTimeAsync(ms)`. Always `vi.useRealTimers()` in `afterEach`. With `userEvent` under fake timers, pass `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Never `await new Promise(r => setTimeout(r, n))`.

## Fetch and the Worker

`vi.stubGlobal("fetch", vi.fn()...)` with a `reply(status, body)` helper (see `test/lib/sync/writes.test.ts`). Call `vi.unstubAllGlobals()` in `afterEach`. Offline is `mockRejectedValue(new TypeError("offline"))`. Test the offline path as well as the 200 path.

## Slow crypto

The lock tests run PBKDF2. Pass a low `iterations` value through the parameter the code takes (`key-crypto.ts`). `lock.test.ts` has one test at 15 s: do not copy it.

## Golden JSON

`import golden from "@shared/line/golden.json"` then `it.each(golden)("T1 parses $line", ({ line, parsed }) => {...})`. Same file the root test reads. Add cases in the JSON.

## Parameterized

`it.each([...])("name $field", (row) => ...)` for same-steps-different-input. Never `forEach(it)` inside a test.

## Flaky test to know about

`test/lib/sync/writes.test.ts` "Undo after it landed queues /api/undo" fails about 1 run in 5: it waits 30 ms with a real timer for the outbox to flush. Fix with fake timers or by awaiting the flush.
