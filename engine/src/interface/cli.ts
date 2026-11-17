// The `brain` command: what the jobs, the hooks and the intake skill run. Adds, to-dos and Find go through `brain serve` (the app and the MCP tools).

import { intakeCommand, threadCommand } from "./cli-intake.ts";
import { checkCommand, indexCommand, swiftbarCommand } from "./cli-reports.ts";
import { killCommand, migrateCommand, pullCommand, serveCommand } from "./cli-service.ts";
import { HELP } from "./cli-help.ts";
import { brainHome } from "../core/notes.ts";
import { fail, out, parseCli, type CliContext } from "./cli-shared.ts";

const COMMANDS: Record<string, (c: CliContext) => Promise<number>> = {
  index: indexCommand,
  check: checkCommand,
  intake: intakeCommand,
  swiftbar: swiftbarCommand,
  thread: threadCommand,
  pull: pullCommand,
  kill: killCommand,
  serve: serveCommand,
  migrate: migrateCommand,
};

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const root = brainHome();
  const interactive = process.stdin.isTTY && process.stdout.isTTY && !argv.includes("--json");
  const [cmd = "help", ...rest] = argv;
  const { values: flags, positionals: args } = parseCli(rest);
  const json = (v: unknown) => out(JSON.stringify(v, null, 2));
  const report = (data: unknown, text: string) => (flags.json ? json(data) : out(text));
  const tag = flags.tag?.[0];
  const limit = flags.limit ? Number(flags.limit) : undefined;

  if (cmd === "help" || cmd === "--help" || cmd === "-h") {
    out(HELP);
    return 0;
  }
  const command = COMMANDS[cmd];
  if (command) return command({ root, cmd, args, flags, interactive, tag, limit, json, report });
  out(HELP);
  return fail(`Unknown command: ${cmd}`);
}
