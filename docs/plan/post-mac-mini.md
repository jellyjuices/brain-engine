# After the Mac mini arrives

Written 2026-11-14 by Claude. The owner approves each step. This is step 2.7 of [plan.md](plan.md), plus the items the owner moved here.

Rule until then: no doc tells a helper to use MCP. Helpers use the `brain` command.

## 1. Move the brain to the mini

1. Copy `~/brain` and `~/Git/brain-engine` to the mini. Copy `~/.config/brain/`.
2. Run the engine `setup.sh` on the mini. It installs the jobs in `launchd/`.
3. Stop the jobs on the MacBook, so only one machine runs the 07:00 job.
4. Test: `launchd/status.sh` is green. Add a note from the Pixel. It shows on the mini.

## 2. Turn on the MCP server

The server is built and tested (step 2.6). It lives at `/mcp` inside `brain serve`. It is not running.

1. Make the helper token: `POST /api/agent-token` as the owner. The token is saved in `~/.config/brain/agent-token`.
2. Cut the tool list first. It has 40 tools, about 4,000 tokens in every helper session. Keep about 15 to 20.
   - Hide: `inbox` (a copy of `add`), `calendar`, `notes_since`, `set_birthday`, `add_file`, the draft tools, and `search`, `card` and `list` if `find` covers them.
   - Keep: add, done, move, delete_todo, undo, find, todos, today, read_note, edit_note, sort, unsorted, make_note, relations, add_relation, log, goals, goal, decision, the 3 intake tools.
   - How: one `mcp: false` field per route in `src/interface/routes/table.ts`. Then run the snapshot test with `UPDATE_SNAPSHOT=1`.
3. Start `brain serve` on the mini. Test: `/mcp` answers with the token, and refuses with no token.
4. Connect one real client (Claude Code on the MacBook). No real client has connected yet, so expect small fixes here.
5. Check the tunnel: the token works from outside, the rate limit answers 429, and a cancelled token stops at once.

## 3. Put MCP into the docs

Do this only after step 2.4 passes.

| File | Change |
| --- | --- |
| Notes `AGENTS.md`, section "Reading and writing the brain" | First line becomes: "Use the brain's MCP tools. If they are not there, use the `brain` command." Replace the command table with the tool names |
| Engine `starter/AGENTS.md` | The same change |
| Engine `AGENTS.md` | "The MCP server at `/mcp` is built, not running" becomes "runs on the mini" |
| Notes `.mcp.json` (new) and engine `starter/.mcp.json` (new) | `{"type":"http","url":"https://<host>/mcp","headers":{"Authorization":"Bearer ${BRAIN_AGENT_TOKEN}"}}`. The token comes from an environment variable. It never goes in a file in git |
| Skills `intake` and `sort` (notes and starter) | Each `brain ...` command becomes its MCP tool |
| Agent `brain-search` (notes and starter) | Tools become `find`, `read_note`, `relations`. Remove Bash, so it can not write |
| Notes `.claude/settings.json` | Allow the read tools. The owner makes this change |

Then remove the old terminal commands (plan step 3.1). Keep index, check, serve, pull and migrate.

## 4. Turn on meaning search

Meaning search uses a small AI model that runs on the mini. It sends nothing to the internet after the first download. The owner moved this here on 2026-11-14.

1. On the mini, in the engine: `npm install`. This adds `@huggingface/transformers`, about 475 MB.
2. Fetch the model once (23 MB) and build the vectors: `BRAIN_MODEL_FETCH=1 brain index --full`.
3. Test with real questions. Tune the match limit (now 0.3) if results are poor.
4. The Pixel and the MacBook then get vectors through the changes feed (search step S6).

Until then, Find works by words, typos, part words, Japanese and Spanish.

## 5. Open after the move

- The mini is the one copy, with no off-site backup. The owner accepted this in plan.md.
- The sorter's nearest-neighbour step (S5) needs the vectors from section 4.
