---
description: How to write tests in every package. Engine and Worker use node:test. The app uses Vitest, happy-dom and Testing Library.
paths:
  - "app/test/**"
  - "worker/test/**"
  - "engine/test/**"
---

# Tests

A test earns its place only if it fails when the product breaks.

Engine and Worker tests use `node:test` and `node:assert/strict`. The Worker has a fake D1 in `worker/test/fake-d1.ts`. App tests use Vitest. The rules below apply to all three. The parts rules (`render()`, `userEvent`, queries) are for the app only.

## What a test covers

- One behaviour per test: one action, then asserts on its result. A second action with its own asserts is a second test.
- Assert what a caller can see: the return value, the response, the file on disk, the screen. Never a private field, an internal call count or a snapshot of an internal object.
- Real scenarios. Build input the way the product does. Never compute the expected value with the same logic as the code.
- Test the error paths that really happen: a bad request, a missing note, a 4xx or 5xx, a lapsed session. A file with only happy paths is not done.
- Test one input once. Two tests with the same input on the same unit become one.

## Isolation

- Mock only the edges: network, the Worker, IndexedDB (`fake-indexeddb`), the clock. Never mock the unit under test or a pure helper. Check `test/helpers.ts` before you write a fake.
- Files only in a temp folder. Engine tests build it from `starter/` with `engine/test/fixture.ts`. Tests never read real notes. Reason: notes are private.
- Real data shapes: a real note title, ISO date, UUID or password. No `"foo"`, `"test"`, `"x"` or `id: 123`.
- Independent tests. No test reads state another test wrote. Reset shared state in `beforeEach`. `beforeAll` is only for read-only setup, such as unlocking the test vault.
- Deterministic. App: `vi.useFakeTimers()` and `vi.setSystemTime()`. Engine and Worker: pass a fixed date into the code. No real sleep, `Date.now()`, `Math.random` or `crypto.randomUUID` driving the result. Sort unordered output before you compare it.

## Parts (app only)

- Drive parts like a user: `render()`, `userEvent.setup()`, `await user.click(...)`. Never call a handler or set state directly. `fireEvent` only for events `userEvent` cannot make: pointer gestures, animation end, paste data.
- Query by `getByRole`, `getByLabelText`, `getByText`. A test id or `querySelector` only when nothing else works.
- Assert a style only when it shows a state the user sees, such as a live mark on a word. Never colours, spacing or sizes.

## Shape

- Arrange, Act, Assert, in that order. No asserts inside the setup.
- Names say the scenario and the result: `"unlock with a bad password is 401 and sets no cookie"`. Never `"works"` or `"renders"`.
- Name values for what they are: `cookie`, `lapsed`, `overdue`. Never `x`, `tmp` or `res2`.
- No `for`, `while`, `if`, `switch`, `try` or `.forEach` in a test body. Loops and ifs in a helper or a fake are fine. `try`/`finally` only to close a server or folder when `t.after` cannot.
- Tests that differ only by input are one table. App: `it.each(cases)`. Engine and Worker: `for (const c of cases) test(name, ...)` at the top level, so each case is its own test.
- Many values in one test: compare them in one `deepEqual`, such as `assert.deepEqual(flags.filter((f) => !cookie.includes(f)), [])`. The failure then shows which ones are wrong.

## Failure messages

- Assert the value, not a boolean about it. `assert.equal(x.length <= 60, true)` and `expect(a === b).toBe(true)` show only `false`. Use `deepEqual`, `match` or `equal` on the value.
- When only a comparison works (`<`, `>`, a file exists), add a message with the real value: `assert.ok(n <= 60, \`got ${n}\`)`.
- A function that returns a boolean by design, such as `isUnlocked()`, may use `toBe(true)`.

## Speed

- The whole suite runs in under 60 s. One unit test runs in under 1 s. Search quality checks (`t9.test.ts`) are the exception.

## Before you finish

- Break the code under test once. If the test still passes, rewrite it.
- Run only the files you changed: `npm run test:app -- test/<file>.test.tsx`, or `node --test engine/test/<file>.test.ts`. Then `npm run gates`.
