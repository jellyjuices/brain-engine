# Pass criteria

One line each. A test file passes a criterion when the check is true. Score a file, fix it, run the package tests again.

## Coverage
- C1 One behaviour: each test has one action. No asserts between two actions on unrelated results. Names with "and" are a hint to look.
- C2 Behaviour, not internals: no `_x`, `#x`, `as any` access to privates, no call-count asserts on internal helpers, no whole-object snapshots of internals.
- C3 Real scenarios: inputs can occur in the product, expected values are written out (not computed with the code's logic), and each file covers at least one error or edge path.
- C4 One place: no two tests use the same input and assert the same unit.

## Isolation
- I1 Edges only: no real network, no path outside a temp folder, no `homedir()`, no mock of the unit under test or an own pure helper.
- I2 Realistic data: real-shaped emails, ISO dates, UUIDs, note titles. No `"foo"`, `"test"`, `id: 123`.
- I3 Independent: no test needs another to run first, shared state is reset, no numbered order names.
- I4 Deterministic: no `setTimeout` waits, no real clock, no unseeded random or `randomUUID` driving a result, 5 runs in a row all pass.

## UI (`web/app`)
- U1 User actions: `userEvent` drives clicks and typing. No direct handler or prop calls, no `.simulate`, no state set from the test. `fireEvent` only for pointer gestures.
- U2 What the user sees: query by role, label or text. No `querySelector`, class or test id when a role, label or text exists.
- U3 Meaningful styles: no asserts on colour, spacing or layout classes unless they show a state.

## Structure
- S1 Arrange, act, assert: setup first, one action, asserts last.
- S2 Names: each name has the scenario and the result. No `works`, `basic`, `test1`.
- S3 Variable names: no `x`, `tmp`, `res2` for key values.
- S4 No logic: no `for`, `while`, `if`, `switch`, `try`, `forEach` inside a test body.
- S5 Parameterized: 3 or more tests that differ only by input become `it.each` or a table.

## Diagnostics
- D1 Clear failures: no `expect(x).toBe(true)` or `assert.ok(a === b)` when the value itself can be compared.
- D2 Root cause: a failing test prints both values, not only a boolean mismatch.
- D3 Fast: each test under 1 s, each package under 60 s.

## Repo rules on top
- R1 Temp-dir brain from `makeBrain()` (root), made-up text only, `npm run privacy` passes.
- R2 Fake embedder, never a real model.
- R3 Shared cases live in the golden JSON, not copied into test files.
- R4 The MCP snapshot changes only with `UPDATE_SNAPSHOT=1` and a reviewed diff.
- R5 `npm run gates` exits 0.
