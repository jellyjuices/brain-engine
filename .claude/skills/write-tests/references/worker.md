# Worker (`worker`)

Run: `npm run test:worker`. It is `node:test` with `node:assert/strict`, same style as the root. Baseline: 33 tests, about 98% lines. Rules also in `.claude/rules/web-tests.md`.

## Files

`worker/test/`: `auth.test.ts`, `calendar.test.ts`, `proxy.test.ts`, `relay.test.ts`, plus helpers `helpers.ts` and `fake-d1.ts`. One file per route group.

## Helpers

- `makeEnv(overrides)` in `helpers.ts` returns `{ env, db }` with a `FakeD1` and made-up secrets (`PASSWORD = "correct horse"`). Override only what the test is about.
- `call(...)` in `helpers.ts` sends a `Request` to the Worker handler and returns the `Response`.
- `FakeD1` in `fake-d1.ts` holds `attempts` and `inbox` Maps and answers the exact SQL the Worker sends. When the Worker gets a new query, teach `FakeD1` that query. Never mock the Worker's own functions.

## Rules that matter here

- Test the failure paths. Wrong password, locked-out client after 5 tries, expired session cookie, bad token, malformed body. Assert the status code and the JSON body.
- Time: the code takes seconds from `Date.now()`. Seed state relative to a fixed `now` value, or use `mock.timers`. Existing tests compute `Math.floor(Date.now() / 1000) - 16 * 60`: that is fine for ageing a row, but never assert on the clock itself.
- Outbound calls (proxy, calendar): inject a fake `fetch` into `env` or the handler. Never reach the network.
- Never read `~/.config/brain/web.env`. Secrets in tests are made up.
- The Worker must not be deployed from here. Tests only.

## Gate

`npm run typecheck`, `lint` and `size` cover the worker and run in `npm run gates` too.
