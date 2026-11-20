import pc from "picocolors";
import { addThread, listThreads, nextThread, updateThread } from "../intake/threads.ts";
import { type CliContext, fail, out, restText } from "./cli-shared.ts";

type Thread = ReturnType<typeof listThreads>[number];

function add(c: CliContext): number {
  const { root, args, flags, report } = c;
  const question = restText(args);
  if (!question || !flags.lens) return fail('Use: brain thread add "question" --lens <lens>');
  const depth = flags.depth ? Number(flags.depth) : undefined;
  const thread = addThread(root, { question, lens: flags.lens, area: flags.area, from: flags.from, depth, privacy: flags.privacy, star: flags.star });
  report(thread, `${pc.green("Saved thread")} in ${thread.path}`);
  return 0;
}

const listLine = (t: Thread) => `${t.starred ? pc.yellow("* ") : "  "}${pc.bold(t.question)}  ${pc.dim([t.status, t.lens, `depth ${t.depth}`, t.path].join(" · "))}`;

function printList(items: Thread[]) {
  if (!items.length) out(pc.dim("No threads."));
  for (const thread of items) out(listLine(thread));
}

function list(c: CliContext): number {
  const { flags } = c;
  const items = listThreads(c.root, { status: flags.open ? "open" : flags.status, lens: flags.lens, area: flags.area });
  if (flags.json) c.json(items);
  else printList(items);
  return 0;
}

function nextLine(t: Thread | undefined) {
  if (!t) return pc.dim("No open threads.");
  const meta = [t.lens, `depth ${t.depth}`, t.from && `from ${t.from}`, t.path].filter(Boolean).join(" · ");
  return `${pc.bold(t.question)}\n  ${pc.dim(meta)}`;
}

function next(c: CliContext): number {
  const thread = nextThread(c.root, { lens: c.flags.lens });
  if (c.flags.json) c.json(thread ?? null);
  else out(nextLine(thread));
  return 0;
}

function starFlag(flags: CliContext["flags"]) {
  if (flags.star) return true;
  return flags.unstar ? false : undefined;
}

function set(c: CliContext): number {
  const name = c.args.slice(1).join(" ");
  if (!name) return fail("Use: brain thread set <name> --status talked");
  const thread = updateThread(c.root, name, { status: c.flags.status, star: starFlag(c.flags) });
  c.report(thread, `${pc.green("Updated")} "${thread.question}" in ${thread.path}`);
  return 0;
}

const THREAD: Record<string, (c: CliContext) => number> = { add, list, next, set };

export async function threadCommand(c: CliContext): Promise<number> {
  const sub = c.args[0] ?? "list";
  const handler = THREAD[sub];
  return handler ? handler(c) : fail(`Unknown thread command: ${sub}. Use add, list, next or set.`);
}
