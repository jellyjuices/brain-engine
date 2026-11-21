import pc from "picocolors";
import { configValue } from "../core/home.ts";

export const HELP = `${pc.bold("brain")}: the jobs and upkeep of your second brain

Add, find and tick to-dos in the app, or through the MCP tools at /mcp. This command keeps what the jobs, the hooks and intake run.

${pc.bold("Upkeep")}
  brain index [--full]          rebuild the search index and .reports/index.md
  brain check                   find broken links and bad labels
  brain serve                   turn device access on (runs in the background)   [--foreground --port --host]
  brain kill                    turn device access off, until the next brain serve
  brain pull                    fetch captures from the device relay into inbox/   [--json]
  brain migrate <name>          show what a one-time change to the notes would do   [--write to apply]
  brain swiftbar                print the menu bar icon and inbox count (used by the SwiftBar plugin)

${pc.bold("Intake")}
  brain intake status           progress per stage, threads and open to-dos; --json also gives the current stage, open threads and the last question
  brain intake stage <n>        one stage's row and its module, from the brain's stages file (0 to 11)
  brain intake save <lens> "…"  add the distilled line to me/<lens>.md   [--session N --quote "…" --raw "full answer" --question "…"]
  brain intake ask "what the owner said"  the one question for an unknown subject, and offers to make a note   [--json]
  brain intake subject "Name"   make a subject note from his answer   [--type person|group|place|thing|topic --role "…" --about <note> --fact "…"]
  brain intake fact <note> "…"  add a fact to a subject note
  brain intake role <subject> --about <note> --role "…"   fix a role on a relation line
  brain intake todo "text"      file a to-do in a subject note   [--when today|tomorrow|date|someday|waiting|note --about <note>]
  brain intake end              the session summary, with how to fix or undo
  brain intake redact "words"   remove those words from lens notes, raw answers and threads
  brain intake privacy <lens> <level>  how much to write down: full, headline or skip
  brain intake done <stage>     mark a stage done (0 to 11, a name or a lens)
  brain thread add "question" --lens <lens>   save a thread in me/<lens>.md   [--depth --star]
  brain thread list             list the first 10 threads, then how many more   [--all --open --status --lens --area]
  brain thread next             the best open thread to talk about next   [--lens]
  brain thread set <name>       change a thread    [--status open|talked|parked|closed --star --unstar]

Add ${pc.cyan("--json")} to any query command for machine-readable output.
Notes live in ${process.env.BRAIN_HOME || configValue("BRAIN_HOME") || "no folder yet: run ops/setup.sh"} (set BRAIN_HOME to change it).`;
