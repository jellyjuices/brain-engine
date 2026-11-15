# node:test in the root (`test/`)

Run: `npm test` (all) or `node --disable-warning=ExperimentalWarning --test test/<file>.test.ts` (one). Coverage: add `--experimental-test-coverage`. Baseline is about 94% lines, 254 tests, 8 s.

## Shape

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
```

Always `assert/strict`. Use `assert.deepEqual` on whole values so a failure prints both sides.

## Fixture brain in a temp dir

- `makeBrain()` in `test/fixture.ts` copies `.schema` and `.templates` from `starter/`, adds blank Area notes and empty note folders under `mkdtempSync(join(tmpdir(), "brain-test-"))`. It returns the root path.
- Write your made-up notes into that root with `writeFileSync`. Never copy from a real brain.
- `REPO`, `STARTER`, `BIN` are exported for paths to the engine itself.
- HTTP tests: `withApi(async (api) => {...})` from `test/api-helpers.ts` starts `createServer` on a free port with `TOKEN`, runs your function, then closes it. Use `api.call("GET", path)`.
- Clean up folders you make outside `makeBrain` in `t.after(...)`.

## Fake embedder

`fakeEmbedder` in `test/t9-brain.ts` maps words to hand-made concept vectors. Pass it where the code takes an `Embedder` (`src/core/embed.ts`). Never load `@huggingface/transformers` in a test.

## T9 search questions

`t9Brain()` builds a made-up brain from `test/fixtures/t9/notes.json`. `questions.json` has 30 questions in six groups (words, typo, part, spanish, japanese, meaning). To add a search case, add a question row. Keep the group counts equal: `t9.test.ts` checks them.

## Golden JSON

`test/line.test.ts` loads `shared/line/golden.json` and checks parse (T1) and format-back (T2) over every row. Add a row for a new todo line shape. A row is `{ "line": "- [ ] Water the fern", "parsed": { "done": false, "text": "...", "tokens": [] } }`.

## MCP snapshot

`test/mcp.test.ts` (T4) compares the tool list to `test/mcp-tools.snapshot.json`. Rewrite only with `UPDATE_SNAPSHOT=1 npm test` after a deliberate change, then review the diff. `mcp-parity.test.ts` checks that MCP tools match the HTTP routes.

## Table tests and no logic

node:test has no `.each`. Make a `const cases = [...]` table and call `test(\`name ${row.name}\`, ...)` in a top-level `for ... of` loop. The loop is outside a test body, so it is fine. A loop or `if` inside a test body is not.

## Time and async

- Use `mock.timers.enable({ apis: ["Date", "setTimeout"], now })` from `node:test` and `mock.timers.reset()` in `t.after`.
- Code that takes `today` or a date argument: pass `"2026-11-05"`.
- Never wait with `setTimeout`. Await the promise the code returns, or poll a condition with a bounded loop in a helper, not in the test.

## Layout

Tests over 200 lines: the size gate (`npm run size`) checks `src` and `bin` only, but keep test files focused. `server.test.ts`, `brain.test.ts`, `intake.test.ts` are the large ones. Split by behaviour when you add to them.
