# Vitest and React (`app`)

Run: `npm run test:app -- test/<path>` from the repo root for the files you changed. Run all (`npm run test:app`, about 15 s) once at the end. After a change, also run `npx prettier --write app/test/<path>` and `npx tsc --noEmit -p app`. Config: `app/vite.config.ts` (happy-dom, `test/**/*.test.{ts,tsx}`, setup `test/setup.ts` loads `jest-dom`). No coverage tool is installed.
## Shape and place

- `app/test/<area>/<name>/<name>.test.tsx`, mirroring `src` (`components`, `screens`, `lib`, `flows`, `shared`).
- Import `describe, expect, it, vi` from `vitest`. Use `@/` for app source and `@shared/` for `engine/shared/`.
- Pure logic: `.test.ts`. Anything that renders: `.test.tsx`.

## Helpers to reuse first (`app/test/helpers.ts`)

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

Never `await new Promise(r => setTimeout(r, n))`. Pick the recipe that fits:

- **Pure logic with a timer or a date** (`session.test.ts`): `vi.useFakeTimers()`, `vi.setSystemTime(new Date("2026-11-05T09:00:00Z"))`, then `vi.advanceTimersByTime(ms)`. `vi.useRealTimers()` in `afterEach`. Assert the exact stored time, not "greater than now".
- **A screen with a timer** (a draft kept after `DRAFT_MS`): `const user = fakeTimeouts()` from `test/helpers.ts`, type with that `user`, `await vi.advanceTimersByTimeAsync(DRAFT_MS)`, `vi.useRealTimers()`, then `vi.waitFor` the stored value. See `note-edit-autosave.test.tsx`. Reason: a plain `userEvent.setup()` hangs under fake timers, and IndexedDB needs real timers again to finish. Import the delay constant from the code. Do not retype `800`.
- **A write that is sent in the background** (`applyChange`, `settle`): `await flush()` from `@/lib/sync/outbox.ts`. It returns the flush that is already running. Then assert. See "Undo after it landed" in `writes.test.ts`.
- **"Nothing happens"**: do not wait and look. Do a second action that does send, through the same path, await it, then assert only that one arrived. See "sends nothing when you leave without a change".
- **A promise the code made**: await the same thing the code awaits (`await import("@/shell/app.tsx")` in `gate.test.ts`).

## Screens that send when they close

`AddScreen`, `NoteEdit` and `JournalScreen` send their text when they unmount. `cleanup()` in `afterEach` unmounts them, so the send lands in the next test. Record what each test typed, and in `afterEach` call `cleanup()` and then `await vi.waitFor` until the outbox holds exactly that. See `leaving` in `note-edit-autosave.test.tsx`. Reason: this leak made the suite fail about 1 run in 5.

## Fetch and the Worker

`vi.stubGlobal("fetch", vi.fn()...)` with a `reply(status, body)` helper (see `test/lib/sync/writes.test.ts`). Call `vi.unstubAllGlobals()` in `afterEach`. Offline is `mockRejectedValue(new TypeError("offline"))`. Test the offline path as well as the 200 path.

## Slow crypto

The vault runs PBKDF2 with 600000 rounds. `vault.ts` has no parameter for it, so lower it at the WebCrypto edge:

- `unlockTestVault()` in `beforeAll` already does this. Use it in any test that only needs an open vault.
- A test of the lock or the vault itself calls `fastPasswordKeys()` from `test/helpers.ts` in `beforeEach` and restores it in `afterEach`. It returns the spy, so a test can still assert the code asked for 600000 rounds. See `vault.test.ts`.
- If the first test in a file is slow, the time is module loading. Import the screen once in `beforeAll`. See `lock.test.ts`.

Never raise a test timeout to make a slow test pass.

## Assert the value

- A list holds an item: `expect(hits.map((h) => h.path)).toContain("topics/fit.md")`, not `.some(...)` then `toBe(true)`.
- Two byte arrays differ: `expect(a.iv).not.toEqual(b.iv)`.
- A button is ready: `expect(button).toBeEnabled()`. Something is gone: `expect(screen.queryByRole(...)).toBeNull()`.
- A function that returns a boolean (`hasKey()`, `isUnlocked()`) keeps `toBe(true)`. The boolean is the value.

## Golden JSON

`import golden from "@shared/line/golden.json"` then `it.each(golden)("T1 parses $line", ({ line, parsed }) => {...})`. Same file the root test reads. Add cases in the JSON.

## Parameterized

`it.each([...])("name $field", (row) => ...)` for same-steps-different-input. Never `forEach(it)` inside a test.

## Ids and dates in results

Pass a fixed id where the code takes one (`enqueue(kind, payload, id)`) and a fixed ISO string in fake replies. No `new Date()` or `crypto.randomUUID()` in a test.
