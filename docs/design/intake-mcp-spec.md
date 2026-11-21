# Spec: intake over MCP

Goal: any AI that connects to `brain serve` can run a full intake with no shell and no files. The intent is in [me-and-intake.md](../intent/me-and-intake.md).

## Why

- Today the intake skill runs the `brain intake` and `brain thread` commands and reads files from the brain folder. An AI on the phone or on another machine has neither.
- The server has three intake tools. The skill needs about a dozen things. Nine have no tool.
- The rules live in skill text, which a model can ignore. The server must enforce them.

## What the skill needs, and what answers it

| The skill does | Today | After |
| --- | --- | --- |
| Where things stand | `brain intake status`, reads `me/settings.yaml` | `intake_status` |
| Open questions | `intake_next` | `intake_next` (more fields) |
| Save a lens line | `intake_save` | `intake_save` (more fields) |
| Pass on a question | `intake_skip` | `intake_thread_set` (status parked) |
| Spot a new name, ask who it is | `brain intake ask` | `intake_ask` |
| Make a subject, fix a role | `brain intake subject`, `role` | `intake_subject` |
| A fact about a subject | `brain intake fact` | `intake_save` with `facts`, or `add` with kind fact |
| File a to-do | `brain intake todo` | `intake_todo` |
| Brain dump, one per line | `brain intake` with piped text | `intake_dump` |
| Set lens privacy | `brain intake privacy` | `intake_privacy` |
| Finish a stage | `brain intake done` | `intake_done` |
| Remove words | `brain intake redact` | `intake_redact` |
| Close a session | `brain intake end` | `intake_end` |
| Save or change a follow-up | `brain thread add`, `set` | `intake_thread_add`, `intake_thread_set` |
| Read the rules, stages, values | files in the brain | the `intake` prompt and `intake://` resources |

## Rules the server enforces

The skill still says them. The tools hold them either way.

1. **Privacy per lens.** `full` keeps the line, the quote and the raw answer. `headline` keeps the line only; `raw` and `quote` are dropped. `skip` refuses the save with a plain message. `intake_next` hides threads on a `skip` lens (it does now).
2. **Raw talks are never edited.** `intake_redact` is the one way words leave a raw talk. It states this in its description.
3. **Writes are one change each.** Every write tool returns `undo_id`, so `undo` can put back that write and nothing else. `intake_redact` cannot be undone; its description says so and says to confirm the words first.
4. **Owner words only.** Tool descriptions use the allowed words. No "park", "drop", "loop", "outcome", "absorb", "triage", "schedule".
5. **The stop word and self-harm rule live in the prompt.** The server cannot hear the owner. The `intake` prompt opens with the 9-8-8 rule and the stop, skip and redact words, before any stage text.
6. **Lens writes name who wrote them.** `by` goes on every line, as it does for `intake_save` now.

## Tools

Names, inputs and what each does. Input types go in `engine/src/interface/mcp/inputs.ts`. Each tool sits in the route table, so the `mcp-parity` test and the snapshot cover it.

### Changed

**`intake_next`** (read). Open questions.
- In: `lens` (optional), `status` (optional: open, talked, parked, closed; default open), `limit` (default 10).
- Out: `threads` with `question`, `lens`, `depth`, `from`, `starred`, `privacy`. With a file context (row 24), the file's `# Intake` questions come first, marked `source: file`.
- Replaces `brain thread list` and `thread next`.

**`intake_save`** (write). One lens line.
- In: `lens`, `question`, `line`, `raw`, `quote` (120 characters at most), `session` (a number), `facts` (a list of `{ into, text }`: a fact about a subject goes to that note, not the lens), `by`.
- Out: `path`, `raw_path` (when kept), `undo_id`.
- Adds what the CLI has and the tool lacks: `quote`, `session`, `facts`.

### New

**`intake_status`** (read). Where things stand.
- Out: `stages` (n, key, name, state, sessions, privacy), `next`, `threads` (counts by status), `to_dos` (captured, sorted, in inbox), and `owner`: what the skill used to read from `me/settings.yaml`: called, pronouns, stop word, own words, privacy per lens.
- An AI over MCP cannot read that file, so this is the only way it learns the stop word.

**`intake_ask`** (write: it records what was asked, so the same question is not asked twice). Looks at what the owner just said.
- In: `text`.
- Out: `ask` (one question about an unknown name) and `offers` (a second-mention prompt, "Make a note?").

**`intake_subject`** (write). Make a subject, or fix its role.
- In: `name`, `type` (Person, Group, Place, Thing, Topic), `role`, `about` (a note path), `fact`, `description`.
- A name that already exists with `about` and `role` fixes the role. A name with no role and no fact is saved bare. A `skip: true` writes nothing and records the skip.
- Out: `path`, `skipped`, `undo_id`.
- Differs from `add_person` and `add_subject`: it links the role to `about`, keeps the session list that `intake_end` reads, and never guesses a role. Those two stay for the app.

**`intake_todo`** (write). File a to-do into its subject note. Never the inbox.
- In: `text`, `when` (today, tomorrow, a date, someday, waiting, note), `about` (a note path).
- Out: `into`, `as` (to-do or note), `text`, `undo_id`.
- Differs from `add`: it tags the line `intake` so `intake_status` counts it, and records it for `intake_end`.

**`intake_dump`** (write). The brain dump, stage 1.
- In: `text` (one line is one item), `single` (keep as one note), `area`.
- Out: the notes saved to the inbox.

**`intake_privacy`** (write). Set one lens to `full`, `headline` or `skip`.
- In: `lens`, `level`. Out: `path`, `undo_id`.
- The description says: only on the owner's word.

**`intake_done`** (write). Mark a stage finished.
- In: `stage` (0 to 11, a name or a lens). Out: the stage, `undo_id`.

**`intake_end`** (write). Close the session.
- Out: `new` (subjects made), `lines` (links made), `to_dos` (count), `text` (plain lines to read to the owner, with how to fix each). Clears the session list.

**`intake_redact`** (write, cannot be undone). Remove words from lens lines, raw talks and threads.
- In: `words`. Out: counts of lens lines, raw answers and threads changed.

**`intake_thread_add`** (write). Save a follow-up question.
- In: `question`, `lens`, `area`, `from`, `depth`, `privacy`, `star`. Out: the thread, `undo_id`.

**`intake_thread_set`** (write). Change a follow-up. Replaces `intake_skip`.
- In: `question` (words that find it), `status` (open, talked, parked, closed), `star` (true or false).
- Passing on a question is `status: parked`. The word shown to the owner is "later".
- Out: the thread, `undo_id`.

### Removed

**`intake_skip`**. `intake_thread_set` does its job. Its description said "Park", which is on the banned list. The skill never called it, so nothing else breaks. The snapshot test changes with it.

## Prompt and resources

The server today offers tools only. It needs two more MCP parts: `prompts` and `resources`. Add both to `capabilities` in `engine/src/interface/mcp/rpc.ts` and answer `prompts/list`, `prompts/get`, `resources/list` and `resources/read`.

**Prompt `intake`.** Input: `stage` (optional; default is the next stage from `intake_status`). It returns, in this order:
1. The care rules: 9-8-8, stop, skip, redact, no diagnoses, own words only, not therapy.
2. How to ask: one open question, reflect and distill, follow one branch, save the rest as threads, three follow-ups at most.
3. The stage text for that stage.
4. A line saying which tools to call and when: `intake_status` first, `intake_ask` after each answer, `intake_end` last.

**Resources.**

| URI | What |
| --- | --- |
| `intake://stages` | The stage table and modules |
| `intake://rules/notes` | The note rules the skill reads first |
| `intake://rules/lenses` | The lens rules |
| `intake://values` | The values list for stage 6 |

**One source.** The text lives once, in the brain's own `.claude/skills/intake/` and `.claude/rules/`, copied from `starter/` by setup and `brain migrate`. The server reads the brain's copy, so an owner's edits apply. The skill file shrinks to a few lines that say "use the `intake` prompt and tools". The stage text is not copied into the engine.

## Gaps this spec closes

- Stage 6 points to `resources/values-list.md`. `starter/resources/` holds only `.gitkeep`, so the file does not exist. Write it, or change stage 6 to say how to pick values without a list. This is an owner call: see the handoff.
- The skill's "fix a mistake" text names `undo_id` for intake saves only. After this spec every write returns one.
- The intent's outcome 3 (resume a cut-off intake): `intake_next` with `status: open` plus `intake_status` already do it. No new tool. The `intake` prompt says to start there.
- Outcome 5 (each lens line shows the date and a link to the raw talk): already true for `full` privacy lines. `headline` lines have no raw talk, so no link.
- Outcome 6 (add new material such as a workbook): not part of this spec. It is part of step R4 in the [roadmap](../plan/roadmap.md), and the workbook-to-lens mapping is an open question in the intent.

## Order of work

1. **Tools** (Medium). The changed and new tools above, `undo_id` on each, privacy enforced in `intake_save`. Tests in `engine/test/intake.test.ts` and the parity snapshot. No skill change yet.
2. **Prompt and resources** (Medium). `prompts` and `resources` in the MCP server, reading the brain's copy.
3. **Cut over** (Small). Rewrite the starter skill to call tools. Remove `brain intake` and `brain thread`. Update `AGENTS.md`, `.claude/rules/brain-cli.md` and the CLI help. Run `brain migrate` on the owner's brain.

Do step 3 only after steps 1 and 2 pass on a real intake run. Row 24 (intake from a file) comes after step 1.
