// The `brain` command. In a terminal, bare `brain` opens the app (interface/ui.ts). Otherwise it lists today, numbered (see todos/verbs.ts).

import { intakeCommand, threadCommand } from "./cli-intake.ts";
import { addCommand, areaCommand, findCommand, listCommand, logCommand, newCommand, recentCommand, showCommand } from "./cli-notes.ts";
import { checkCommand, indexCommand, reviewCommand, swiftbarCommand, todayCommand, weeklyCommand } from "./cli-reports.ts";
import { killCommand, migrateCommand, pullCommand, serveCommand } from "./cli-service.ts";
import { doneCommand, listTodayCommand, moveCommand, sortCommand, tagCommand, todosCommand } from "./cli-todos.ts";
import { HELP, HELP_ALL } from "./cli-help.ts";
import { brainHome } from "../core/notes.ts";
import { fail, out, parseCli, type CliContext } from "./cli-shared.ts";

const COMMANDS: Record<string, (c: CliContext) => Promise<number>> = {
  "list-today": listTodayCommand,
  move: moveCommand,
  delete: moveCommand,
  undo: moveCommand,
  add: addCommand,
  new: newCommand,
  find: findCommand,
  search: findCommand,
  list: listCommand,
  show: showCommand,
  recent: recentCommand,
  area: areaCommand,
  today: todayCommand,
  weekly: weeklyCommand,
  review: reviewCommand,
  index: indexCommand,
  check: checkCommand,
  tag: tagCommand,
  sort: sortCommand,
  intake: intakeCommand,
  done: doneCommand,
  todos: todosCommand,
  swiftbar: swiftbarCommand,
  thread: threadCommand,
  threads: threadCommand,
  log: logCommand,
  pull: pullCommand,
  kill: killCommand,
  stop: killCommand,
  serve: serveCommand,
  migrate: migrateCommand,
};

const HIDDEN_ALIASES: Record<string, string> = {
  drop: "delete",
  triage: "sort",
  absorb: "sort",
  loops: "todos",
};

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const root = brainHome();
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !argv.includes("--json");
  // Bare `brain` (and `brain menu`) open the app in a terminal. Anywhere else, bare `brain` prints the numbered list.
  if ((argv.length === 0 || argv[0] === "menu") && interactive) return (await import("./ui.ts")).ui(root);
  const [first = "list-today", ...others] = argv;
  const [cmd, rest] = first === "--json" || first === "menu" ? ["list-today", argv.slice(first === "menu" ? 1 : 0)] : [first, others];
  const { values: flags, positionals: args } = parseCli(rest);
  const json = (v: unknown) => out(JSON.stringify(v, null, 2));
  const report = (data: unknown, text: string) => (flags.json ? json(data) : out(text));
  const tag = flags.tag?.[0];
  const limit = flags.limit ? Number(flags.limit) : undefined;

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    out(flags.all ? HELP_ALL : HELP);
    return 0;
  }
  const command = COMMANDS[cmd] ?? COMMANDS[HIDDEN_ALIASES[cmd] ?? ""];
  if (command) return command({ root, cmd, args, flags, interactive, tag, limit, json, report });
  out(HELP);
  return fail(`Unknown command: ${cmd}`);
}
