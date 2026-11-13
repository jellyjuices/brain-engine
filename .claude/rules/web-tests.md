---
description: How to write web app tests (Vitest, happy-dom, Testing Library) and Worker tests (node:test).
paths:
  - "web/app/test/**"
  - "web/worker/test/**"
---

# Web tests

A test earns its place only if it fails when the product breaks.

App tests use Vitest. Worker tests use `node:test` and `node:assert/strict`, with a fake D1 in `web/worker/test/fake-d1.ts`. The rules below apply to both. The parts rules (`render()`, `userEvent`, queries) are for the app only.

- One behaviour per test: one action, then asserts on its result.
- Assert what a caller can see, not internals.
- Mock only the edges: network, the Worker, IndexedDB (`fake-indexeddb`), the clock. Check `test/helpers.ts` before you write a fake.
- Real data shapes: a real note title, ISO date or UUID. No `"foo"` or `id: 123`.
- Deterministic: `vi.useFakeTimers()` and `vi.setSystemTime()`. No real timers, `Date.now()`, `Math.random` or `crypto.randomUUID` driving the result.
- Drive parts like a user: `render()`, `userEvent.setup()`, `await user.click(...)`. Never call a handler directly.
- Query by `getByRole`, `getByLabelText`, `getByText`. A test id only when nothing else works.
- No `for`, `if`, `try` or `.forEach`. Tests that differ only by input become one `it.each`.
- Assert the value, not a boolean about it.
- Tests never read real notes. Reason: notes are private. Build blank ones.
- Before you finish, break the code under test once. If the test still passes, rewrite it.
