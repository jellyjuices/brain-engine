---
name: write-tests
description: Writes or fixes tests in brain-engine the way this repo does them (node:test in engine and web/worker, Vitest and Testing Library in web/app). Use when asked to "write tests", "add a test", "test this", "cover this", "fix a flaky test", or after adding or changing code in engine/src, engine/shared, web/app/src or web/worker/src.
---

# Write tests

A test earns its place only if it fails when the product breaks. Read the reference for the package you touch, only that one:

- `engine/` (the `brain` code and its `test/`): [references/node-test.md](references/node-test.md). In this skill, `test/`, `src/` and `shared/` with no folder in front mean the ones inside `engine/`
- `web/app` and `web/design-system` (Vitest, React): [references/vitest-react.md](references/vitest-react.md)
- `web/worker`: [references/worker.md](references/worker.md)
- The checkable list another agent scores tests against: [references/criteria.md](references/criteria.md)

## Steps

1. Find the nearest existing test for the same area and copy its shape and helpers.
2. Name the behaviour in one sentence. That sentence is the test name.
3. Write the test: arrange, one action, assert the result.
4. Break the code under test once. The test must fail. If it passes, rewrite it.
5. Run only the test files you changed. Run them three times if they have timing or async work.
6. Score each changed file against [references/criteria.md](references/criteria.md), line by line. Fix what fails.
7. Run `npm run gates` once, at the end.

## When you fix old tests

- Never delete a test and never weaken an assertion. A split test keeps every assertion it had.
- Change tests, helpers and fixtures only. If a test needs a hook the code does not have, first try the edge (WebCrypto, the clock, fetch). Change product code last, and say so.
- A failure that shows up only after you made tests faster is often a leak between tests. Find the leak. Do not add a wait.
- One commit per criterion, staged by path.

## Where tests go and what they are called

- Engine: `engine/test/<topic>.test.ts`, flat, one file per topic. Helpers and fixtures sit beside them (`fixture.ts`, `api-helpers.ts`, `t9-brain.ts`).
- App: `web/app/test/<area>/<name>/<name>.test.ts(x)`, mirroring `src`. Shared helpers: `web/app/test/helpers.ts`.
- Worker: `web/worker/test/<topic>.test.ts`. Helpers: `helpers.ts`, `fake-d1.ts`.
- Name = scenario plus result: `"Undo after it landed queues /api/undo"`. Reason: a red test name should say what broke.
- Prefix `T1`, `T2`... only for the numbered suites that already use them (line, T9, MCP).

## Rules

- **One behaviour per test.** One action, then asserts on its result. Reason: a failure points at one cause.
- **Assert what a caller sees.** Return values, files, HTTP replies, screen text. Never private members or call counts of internal helpers.
- **Assert the value, not a boolean about it.** `assert.deepEqual(got, want)`, not `ok(got === want)`. Reason: the failure prints both values.
- **Build the world in a temp folder.** `makeBrain()` from `test/fixture.ts` makes a fresh brain from `starter/`. Add notes with made-up text. Reason: tests must never see a real brain.
- **No real `~/brain`, `~/.config` or home paths.** Pass paths in. Never read `homedir()` in a test. Reason: notes and deploy values are private, and the run must work on any machine.
- **Made-up text only.** Fake names, places and notes. The privacy scan (`npm run privacy`) fails the gate on real words. Reason: this repo is public.
- **Use a fake embedder, never a model.** `fakeEmbedder` in `test/t9-brain.ts` has hand-made concept vectors. Reason: a real model is slow, large and changes.
- **Mock only the edges.** Network, the clock, IndexedDB (`fake-indexeddb`), the Worker. Never mock the unit under test or an own helper. Prefer a real fixture over a mock of your own code.
- **No sleeps.** Never `setTimeout` to wait. Use fake timers (`vi.useFakeTimers()` and `vi.setSystemTime()` in Vitest, `mock.timers` in node:test) or await the exact thing. Reason: a 30 ms sleep made `writes.test.ts` fail about 1 run in 5.
- **Fix the clock.** Pass a fixed date (`NOW = "2026-11-05"`) into code that takes one. No `Date.now()`, `Math.random` or `crypto.randomUUID` driving a result.
- **Tests stand alone.** No order, no shared mutable state. Reset in `beforeEach` or `afterEach`. Remove temp folders you made.
- **No logic in a test.** No `for`, `if`, `try`, `forEach`. Same steps with different input become `it.each` (Vitest) or a table plus `for ... of` that creates one `test()` per row (node:test).
- **Cover the edge and the failure.** Empty input, wrong token, offline, bad date, missing file. A file with only happy paths is not done.
- **Keep it fast.** One test under 1 s. Lower costly work (for example PBKDF2 `iterations`) in the test instead of paying it.
- **Real data shapes.** A real-looking note title, ISO date (`2026-11-05`), UUID. Never `"foo"` or `id: 123`.

## Shared data: the golden JSON pattern

One JSON file feeds two test runners, so the CLI and the app agree.

- `shared/line/golden.json`: rows of `{ line, parsed }`. Root `test/line.test.ts` reads it with `readFileSync`. `web/app/test/shared/line.test.ts` imports it as `@shared/line/golden.json` and uses `it.each(golden)`.
- T9 questions: `test/fixtures/t9/questions.json` and `notes.json`, built into a brain by `t9Brain()` in `test/t9-brain.ts`.
- To add a case, add a row to the JSON. Do not copy the case into a test file. Reason: one source of truth.
- MCP tool list: `test/mcp-tools.snapshot.json`. After a deliberate tool change, run `UPDATE_SNAPSHOT=1 npm test`, then read the git diff before you commit it. Never refresh it to make a failure go away.

## Top failure patterns in this repo and the fix

| Pattern | Fix |
| --- | --- |
| `await new Promise(r => setTimeout(r, 30))` | `await flush()`, or `fakeTimeouts()` for a screen. Recipes: "Time" in `vitest-react.md` |
| A wait to prove "nothing happens" | Do a second action that does send, await it, assert only that one arrived |
| A screen left open sends its text into the next test | Wait for the test's own send in `afterEach` |
| One test over 1 s from PBKDF2 | `unlockTestVault()` or `fastPasswordKeys()` from `web/app/test/helpers.ts` |
| One root test over 1 s | It runs the `brain` command too often. 3 runs or fewer per test |
| A test that passes only on the owner's Mac | Pass `BRAIN_HOME: makeBrain()`. Use a fixed clock, never `Date.now()` against a file time |
| `expect(x).toBe(true)` or `ok(a === b)` | Compare the value itself. Patterns: "Assert the value" in each reference |
| `try/finally` and `if` inside a test (`pull.test.ts`, `mcp-parity.test.ts`) | Move setup and cleanup to `t.after`, `beforeEach` or a helper like `withApi()` |
| `querySelector` or test id when a role or text exists (`markdown.test.tsx`) | `getByRole`, `getByLabelText`, `getByText` |
| Many assertions behind one `it("... and ...")` | Split into one test per behaviour |
| Files with only happy paths (`card`, `file`, `mentions`, `relations`, `review`, `service`) | Add the bad input and the failure case |

## Before you finish

- [ ] Name says scenario and result. One action per test.
- [ ] Temp folder, made-up text, no home paths, no real model, no network.
- [ ] No sleeps, no real clock, no `for`/`if`/`try`.
- [ ] Edge and failure case covered.
- [ ] Broke the code once and the test failed.
- [ ] Ran the package tests three times if the test has timing or async work.
- [ ] `npm run gates` exits 0. A failure in a file you did not touch is another agent's work: say so in one line.
- [ ] Committed by path. No `git add -A`.
