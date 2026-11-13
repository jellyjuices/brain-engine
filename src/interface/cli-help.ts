import pc from "picocolors";
import { configValue } from "../core/home.ts";

export const HELP = `${pc.bold("brain")}: your second brain

  brain                     open the app (in a terminal). Piped: today, numbered
  brain add "text"          save a thought. "fri: call Mom" files it as a to-do
  brain done <n|words>      tick it off
  brain move <n> <when>     today, tomorrow, fri, YYYY-MM-DD, someday or waiting
  brain drop <n>            let it go
  brain find "words"        search, with the subject's card first
  brain undo                put back the last change
More: ${pc.cyan("brain help --all")}`;

export const HELP_ALL = `${pc.bold("brain")}: your second brain

${pc.bold("Usage")}
  brain                         open the app in a terminal. Piped or with --json: today, numbered
  brain menu                    same as brain
  brain done <n|words>          tick off a to-do (a number from the last list, or words from it)
  brain move <n> <when>         move a to-do: today, tomorrow, a weekday, YYYY-MM-DD, someday or waiting
  brain drop <n>                drop a to-do (it stays in the note, ticked and marked dropped)
  brain undo                    reverse the last done, move or drop
  brain add "text" [--tag t]    save a note to inbox/
  brain new <Type> "Title" -d "…" new note from a template (Person, Group, Place, Thing, Topic, Project, …)
  brain new Event "Title" --date YYYY-MM-DD [--with people/x.md --area a]   a dated visit or meeting
  brain find "words"            search all notes   [--type --tag --area --limit --all]
  brain list                    list notes         [--type --tag --area --status]
  brain show <name or path>     one note in full, plus notes that link to it
  brain recent [days]           notes changed in the last N days (default 7)
  brain area <slug>             one-page brief of an area → .reports/area-<slug>.md
  brain today                   today's report → .reports/today.md
  brain review                  the short weekly review (asks questions in a terminal)   [--json]
  brain weekly                  weekly report → .reports/weekly.md
  brain index [--full]          rebuild the search index and .reports/index.md
  brain check                   find broken links and bad labels
  brain tag [--dry-run]         add tags to inbox notes from .schema/rules.yaml
  brain sort [--dry-run]        file inbox notes that have a type, title and description
  brain intake                  brain dump (one line = one note)
  brain intake <area>           answer the 5 questions for one area
  brain intake status           progress per stage, threads and open to-dos
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
  brain thread list             list threads       [--open --status --lens --area]
  brain thread next             the best open thread to talk about next   [--lens]
  brain thread set <name>       change a thread    [--status open|talked|parked|closed --star --unstar]
  brain log ["text"]            show recent changes, or add a line to .log.jsonl
  brain todos                   list every open to-do   [--area --all --json]
  brain pull                    fetch captures from the phone relay into inbox/   [--json]
  brain serve                   turn phone access on (runs in the background)   [--foreground --port --host]
  brain kill                    turn phone access off, until the next brain serve
  brain swiftbar                print the menu bar icon and inbox count (used by the SwiftBar plugin)

Add ${pc.cyan("--json")} to any query command for machine-readable output.
Notes live in ${process.env.BRAIN_HOME || configValue("BRAIN_HOME") || "no folder yet: run setup.sh"} (set BRAIN_HOME to change it).`;
