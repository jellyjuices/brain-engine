import { intakeCommand } from "./cli-intake.ts";
import { threadCommand } from "./cli-thread.ts";
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

const HELP_WORDS = new Set(["help", "--help", "-h"]);

const isInteractive = (argv: string[]) => Boolean(process.stdin.isTTY && process.stdout.isTTY) && !argv.includes("--json");

function context(cmd: string, rest: string[], interactive: boolean): CliContext {
  const { values: flags, positionals: args } = parseCli(rest);
  const json = (v: unknown) => out(JSON.stringify(v, null, 2));
  const report = (data: unknown, text: string) => (flags.json ? json(data) : out(text));
  const limit = flags.limit ? Number(flags.limit) : undefined;
  return { root: brainHome(), cmd, args, flags, interactive, tag: flags.tag?.[0], limit, json, report };
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const [cmd = "help", ...rest] = argv;
  if (HELP_WORDS.has(cmd)) {
    out(HELP);
    return 0;
  }
  const command = COMMANDS[cmd];
  if (command) return command(context(cmd, rest, isInteractive(argv)));
  out(HELP);
  return fail(`Unknown command: ${cmd}`);
}
