# Spec: jobs in `brain serve` (R2)

Goal: the owner starts a file ask or an intake on a small screen, away from home, with no Claude. `brain serve` does the work with a local model on the home server. Intent: [helpers.md](../intent/helpers.md) aims 11 and 12, [me-and-intake.md](../intent/me-and-intake.md). Road: [roadmap.md](../plan/roadmap.md) track R.

## The add-on: home helper

- The owner-facing name is **home helper**: a helper that runs on your home server. The app already says "It waits for a helper", so the word is known.
- It is optional, like the calendar feed. The engine is for anyone. Nobody needs a model to use the brain.
- Two lines in `~/.config/brain/env` turn it on: `BRAIN_HELPER_URL=http://127.0.0.1:11434` and `BRAIN_HELPER_MODEL=<model tag>`. Both must be set, or it stays off.
- `ops/setup.sh` asks once: "Turn on the home helper? It needs Ollama and a model on this home server." A yes writes the two lines. A no writes nothing. The owner can also add or delete the lines by hand.
- The server reads the lines on each job, as it reads the agent token. A change works with no restart.
- No model name and no URL live in code. [local-models.md](local-models.md) is one example setup: `qwen3.6:35b-mlx` on a home server with 32 GB of memory and Apple silicon.
- `docs/phone-setup.md` gets a "Home helper (optional)" section, shaped like "Calendar feed (optional)".
- The URL must be loopback (`127.0.0.1`, `localhost`, `::1`). Any other host keeps the helper off and `brain check` says why. Reason: notes never leave the home server.

## Without a local model

- Everything works as today. File asks stay in `asks` and wait for a Claude chat over MCP or for the owner.
- The file page shows today's row: "You can leave. It waits for a helper." No Try again, no Stop, no job states.
- The intake in the app runs on server steps only. Lines come from the owner or the device's own summary, as now.
- The job routes exist. `GET /api/jobs` answers `helper: "off"` and no jobs. A start answers 409: "No helper is set up on your home server."
- No job records are made. No timer runs. Idle cost stays as today.

## Job record

- One JSON file per job in `.brain/jobs/<id>.json`. `.brain/` is made by brain and ignored by git, as drafts are. It survives a restart.
- Fields: `id`, `kind`, `note` (the file or lens path), `state`, `tries`, `made`, `started`, `finished`, `reason` (owner words, on failed only), `undo_id` (on done), `by` (the model tag), `result` (counts and paths only, never note text), `session` (intake only).
- States: `waiting`, `working`, `done`, `failed`. A stopped job is `failed` with reason "Stopped."
- One job at a time. One worker in the `brain serve` process takes the oldest `waiting` job. The port is the lock: a second `brain serve` cannot start.
- Order: `intake_summary` jobs go first, then the rest by `made`.
- At start-up, a `working` job goes back to `waiting`. Then, with the helper on, every note with `asks` gets a job for each ask that has no record yet.
- One record per note and kind. A start for a pair already `waiting` or `working` returns that job. Reason: a retry from a flaky connection makes no copy.
- Before it runs, the worker checks the ask is still in `asks`. If a Claude chat did it first, the job is `done` with reason "Done by another helper." It re-checks before it writes.
- Retry: the runner retries a bad answer once on its own. After that the job is `failed`. The owner can tap Try again any number of times.
- Clean-up at start-up: a `done` or `failed` record older than 30 days is deleted, unless its ask is back in `asks` (so an undo does not run it again on its own).

## Job kinds (v1)

Every write marks `generated: { by: <model tag>, at }`. A job's writes, and taking the ask out of `asks`, are one `changeFiles` entry, so one undo puts all of it back. After an undo the ask is back and the file page offers Start. Each item the model returns must carry `from`, a quote of up to 120 characters that appears word for word in the source. An item whose quote is not found, or whose path is not on the given list, is left out and counted.

| Kind | Reads | Writes | `max_tokens`, temperature |
| --- | --- | --- | --- |
| `split` | The file body. Up to 300 subjects (path, type, title, aliases) that rules-first matching finds in the text, plus General | Each to-do or fact into its subject, linking back to the file. No match or unsure: best guess plus `· check` | 4000, 0.2 |
| `enrich` | The file body. Up to 10 notes the text names, each body cut to 2 KB | Facts under each named note, linking back to the file | 3000, 0.2 |
| `questions` (the `intake` ask) | The file body and the lens list | A `# Intake` list on the file note, at most 12 questions | 1500, 0.5 |
| `intake_summary` | One saved answer: the raw answer for a `full` lens, the line only for `headline` | To-dos via the `intake_todo` path, subject facts via `intake_save` `facts`. Goal ideas are kept on the record as offers and write nothing | 1500, 0.3 |

JSON schemas, all `additionalProperties: false`:

- `split`: `{ items: [{ kind: "todo" | "fact", text, when?, into: <path from the list>, check: boolean, from }] }`
- `enrich`: `{ facts: [{ into, text, from }] }`
- `questions`: `{ questions: [{ question, lens, from }] }`
- `intake_summary`: `{ todos: [{ text, when?, into, from }], facts: [{ into, text, from }], goal_ideas: [{ text, from }], care: boolean }`

Prompt shape: a system part with the role, the rules (never invent a fact, never diagnose or label the owner, quote the source, use only listed paths, the owner's own words, JSON only) and the schema. A user part with the source text inside `<file>` tags and the list inside `<subjects>` tags. The text is data. The model has no tools, so text in a file cannot make it act.

## The model runner

- One module, `engine/src/helper/runner.ts`, with one call: `ask({ kind, system, user, schema, maxTokens, temperature })`. It returns checked JSON or throws a `HelperError` with an owner-words reason.
- `helperConfig()` reads the two config lines each call and returns `null` when the helper is off.
- It speaks the OpenAI-compatible API: `POST <url>/v1/chat/completions` with `response_format: { type: "json_schema" }`. Another local engine with that API works by changing the config.
- Load and unload use Ollama's `keep_alive`, sent through `POST <url>/api/generate` with an empty prompt. An engine without that path ignores it.
- [UNCERTAIN: whether Ollama's `/v1` path passes `think: false` and `keep_alive`. R3 checks this first. If not, the runner uses Ollama's native `/api/chat` with `format`, `options.num_predict` and `think: false`.]
- Context: `OLLAMA_CONTEXT_LENGTH=32768` in the Ollama service, set by the setup section. A 60 KB file is about 15k tokens, so it fits with the subject list and the answer.
- Keep policy: a background job loads the model, and after the last waiting job a `keep_alive: 0` call unloads it. An intake keeps it for `10m`, and each saved answer renews that. `intake_end` unloads it when no job waits. Reason: on the example home server the model takes 25 GB and swap grew to 12.7 GB, so it is never resident all day.
- Warm-up: `warm()` sends an empty prompt with `keep_alive: "10m"`. It returns at once and the load runs in the background.
- Timeouts: warm 90 s (a cold start took 12 s to load and 23 s to read the first prompt), a background job call 180 s, an `intake_summary` call 30 s. A refused connection fails at once with "The helper is not running on your home server."
- JSON check (Ollama MLX bug #18567 can print blank space until the cap): always send `max_tokens`. Reject a reply that ends on `length`, does not parse, or fails the kind's guard. Retry once. A second bad reply fails the job with "The helper's answer could not be read." Each kind has a small type guard. No new package.

## Routes

All in `routes/table.ts`. Job routes are live calls through the Worker proxy, not outbox writes. Each returns fast, under the Worker's 8 s timeout. The work runs in the worker.

| Route | Tool | MCP | What |
| --- | --- | --- | --- |
| `GET /api/jobs?note=` | `jobs` | yes | `helper` (`on`, `off`, `not answering`) and the jobs, newest first. A Claude chat reads it so it does not do an ask a job is doing |
| `POST /api/jobs` `{ kind, note }` | `start_job` | owner only | Start one job. 409 when the helper is off |
| `POST /api/jobs/retry` `{ id }` | `retry_job` | owner only | A `failed` job goes back to `waiting` |
| `POST /api/jobs/stop` `{ id }` | `stop_job` | owner only | Stops a `waiting` or `working` job. A working call is cut off and writes nothing |
| `POST /api/helper/warm` | `warm_helper` | owner only | Loads the model. Does nothing when off |

- `add_file` makes one job per ask in the same request when the helper is on. An add that waited offline in the Worker gets its jobs when `brain pull` writes it.
- `intake_save` returns `job` (the `intake_summary` id) when the helper is on.
- Owner-only routes are left out of MCP. Reason: a Claude chat does the work itself. It has no need to queue the local model.

## Intake in the app

The app drives the intake. The server holds the rules. Steps are the [intake-mcp-spec](intake-mcp-spec.md) tools, called as routes.

| In the app | Server step | Model |
| --- | --- | --- |
| Open the intake | `intake_status` (stage, stop word, privacy), then `warm_helper` when on | Loads |
| Show a question | `intake_next`. From a file page, the file's `# Intake` questions come first | None |
| Save an answer | `intake_save` with the line and raw answer. Privacy per lens holds here | `intake_summary` job for this answer |
| A new name | `intake_ask` on the answer, then `intake_subject` with the reply | None |
| Later | `intake_thread_set` with `status: parked`. The owner sees "later" | None |
| Stop, or finish | `intake_end`. It waits up to 30 s for summary jobs, then lists what was made | Unloads |

- The model only adds the summary step. With the helper off, every step above still runs and the summary row never shows.
- The stop word ends the intake at once, before any save.
- `intake_save` checks the answer against a short self-harm word list. A hit returns `care: true`. A summary job's `care: true` does the same. Either way the app stops the intake and shows 9-8-8.
- A goal idea shows as "Make a goal?" with Yes and Not now. Nothing is made without a yes.

## Screen states

| State | File page row | Button |
| --- | --- | --- |
| Helper off | "You can leave. It waits for a helper." (today) | none |
| `waiting` | "Next up. You can leave." No spinner | Stop |
| `working` | "Working on it. You can leave." Spinner | Stop |
| `done` | The section fills in, as C3 in [sort-flow-spec.md](sort-flow-spec.md). "Marked as written by a helper." | Undo |
| `failed` | "Could not finish. <reason>" | Try again |
| Not answering | "The helper on your home server is not answering. It waits." No spinner | Try again |

- Intake, after a save with the helper on: "From your last answer: 1 to-do, 2 notes." with Undo. While its job waits: nothing shows.
- The app polls `jobs` every 5 s only while a file page or the intake shows a `waiting` or `working` job. Otherwise it does not poll.

## Privacy

- The rules from intake-mcp-spec hold for every job: privacy per lens, raw talks never edited, one change per write with an undo id, owner words, `by` on every line.
- Never sent to the model: a `skip` lens; the raw answer of a `headline` lens; `me/settings.yaml`; `sources/` except this session's raw answers on `full` lenses; `.archive/`; tokens and config.
- `split`, `enrich` and `questions` never read or write `me/`. A lens line comes only from `intake_save`.
- Job records and the server log hold paths, counts and reasons. They never hold note text or model replies.
- `intake_redact` also clears matching goal ideas on job records.

## Done when

- [ ] With no helper lines in config, the app looks and works as today, and `GET /api/jobs` answers `helper: "off"`.
- [ ] With no helper, the file page shows no job states, no Try again and no Stop.
- [ ] With no helper, `POST /api/jobs` answers 409 with "No helper is set up on your home server."
- [ ] With no helper, the intake in the app runs from open to finish on server steps.
- [ ] Two lines in `~/.config/brain/env` turn the helper on with no restart. Deleting one turns it off.
- [ ] No model tag or helper URL appears in engine or app code (`grep` finds none).
- [ ] A helper URL that is not loopback keeps the helper off, and `brain check` says why.
- [ ] `setup.sh` asks about the home helper once and writes the lines only on a yes.
- [ ] Adding a file with "split" makes a job. Later its parts show, each with `generated`, and one undo takes them all back with the ask.
- [ ] Two jobs never run at once. A `working` job is `waiting` again after a restart.
- [ ] A reply that ends on `length` or fails the guard is retried once, then the job fails with an owner-words reason and offers Try again.
- [ ] An item whose `from` quote is not in the source is never written.
- [ ] After the last job, the model is unloaded (`ollama ps` shows none).
- [ ] Opening the intake warms the model. The first summary after warm-up takes under 5 s.
- [ ] A `headline` lens answer never reaches the model raw (a test with a fake runner checks the prompt).
- [ ] With no job running, `brain serve` sits near 0% CPU and about 115 MB.
- [ ] No owner-facing text uses absorb, triage, loop, outcome, drop, park or schedule.

## Steps

| # | Step | Size | Roadmap |
| --- | --- | --- | --- |
| 1 | `helperConfig()`, the runner, the JSON guard and retry. Tests against a fake OpenAI-compatible server | Medium | R3 |
| 2 | Job store in `.brain/jobs/`, the worker, restart recovery, the five routes, the `add_file` hook | Medium | R3 |
| 3 | `split` kind with quote checks and one log entry | Medium | R3 |
| 4 | `enrich` and `questions` kinds | Medium | R3 |
| 5 | `setup.sh` question and the "Home helper (optional)" section in `docs/phone-setup.md` | Small | R3 |
| 6 | File page states, Try again, Stop, and polling | Medium | R4 |
| 7 | App intake on server steps (needs intake-mcp-spec step 1), stop word and care check | Large | R4 |
| 8 | `intake_summary` kind, warm on open, the summary row and goal offers | Medium | R4 |
| 9 | Live check on the home server: memory, unload, timings | Small | owner runs it |

## Open questions

1. Should `split` and `enrich` file straight away, or show a list to check first? My pick: file straight away with `· check` and Undo, like the sort.
2. Should the helper also write follow-up questions during an intake? My pick: not in v1. Follow-ups come from saved threads.
3. Should background jobs run at once, or only at night? My pick: at once. One at a time and the unload after keep the cost short.
4. Should a goal idea from an intake ask "Make a goal?" on the spot, or wait in the summary at the end? My pick: at the end, so the talk is not broken up.
