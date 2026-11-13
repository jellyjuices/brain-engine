import pc from "picocolors";
import { sortInbox, tagInbox } from "../capture/actions.ts";
import { loadAll } from "../core/files.ts";
import { type CliContext, fail, out } from "./cli-shared.ts";

export async function listTodayCommand(c: CliContext): Promise<number> {
  const { root, flags, report } = c;
  const { dayList, listLines } = await import("../todos/day-list.ts");
  let items = dayList(root);
  if (!flags.json && process.stdin.isTTY && process.stdout.isTTY && items.some((x) => x.group === "overdue")) {
    out(listLines(items).join("\n") + "\n");
    const line = await (await import("../todos/overdue.ts")).askOverdue(root);
    if (line) { out(line); items = dayList(root); }
    else return 0;
  }
  report(items, listLines(items).join("\n"));
  return 0;
}

export async function moveCommand(c: CliContext): Promise<number> {
  const { root, cmd, args, flags, report } = c;
  const verbs = await import("../todos/verbs.ts");
  try {
    const ask = cmd === "drop" && !flags.json && process.stdin.isTTY && process.stdout.isTTY;
    const result = cmd === "undo" ? (await import("../todos/undo.ts")).undo(root) : cmd === "drop" ? (ask ? await (await import("../todos/wrapup.ts")).dropInTerminal(root, args.join(" ")) : verbs.drop(root, args.join(" "))) : verbs.move(root, args[0] ?? "", args.slice(1).join(" "));
    report(result, result.line);
    return 0;
  } catch (err) {
    return fail((err as Error).message);
  }
}

export async function tagCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const result = tagInbox(root, flags["dry-run"]);
  if (flags.json) json(result);
  else if (!result.length) out(pc.dim("No inbox notes matched a rule."));
  else for (const x of result) out(`${x.path}  ${pc.cyan("+ " + x.added.join(", "))}`);
  return 0;
}

export async function sortCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const result = sortInbox(root, flags["dry-run"]);
  if (flags.json) json(result);
  else {
    const moved = result.filter((x) => x.to);
    for (const result of moved) out(`${result.path} ${pc.dim("→")} ${result.to}`);
    out(`${moved.length} filed, ${result.length - moved.length} left in inbox.`);
  }
  return 0;
}

export async function absorbCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json, report } = c;
  // brain absorb                      → plan for every sorted capture (menu in a terminal, JSON otherwise)
  // brain absorb --yes                → file every capture that has a suggested home
  // brain absorb <capture> --into <note>
  const { absorb, planAbsorb } = await import("../todos/absorb.ts");
  if (args[0]) {
    if (!flags.into) return fail("Use: brain absorb <capture path> --into <note path>");
    const result = absorb(root, args[0], flags.into);
    report(result, `${pc.green("Filed")} into ${result.into} as ${result.as === "loop" ? "a to-do" : "a note"}.`);
    return 0;
  }
  const plan = planAbsorb(root);
  if (flags.yes) {
    const done = plan.filter((x) => x.into).map((x) => ({ ...x, ...absorb(root, x.capture, x.into!) }));
    report(done, `${pc.green("Filed")} ${done.length} of ${plan.length}. ${plan.length - done.length} need a home: run brain absorb in a terminal.`);
    return 0;
  }
  if (flags.json || flags["dry-run"] || !process.stdin.isTTY) {
    if (flags.json) json(plan);
    else for (const x of plan) out(`${x.text.slice(0, 60)}  ${pc.dim("→")}  ${x.into ?? pc.yellow("needs a home")}  ${pc.dim(`(${x.as}, ${x.reason})`)}`);
    return 0;
  }
  const { triage } = await import("./menu.ts");
  return triage(root);
}

export async function doneCommand(c: CliContext): Promise<number> {
  const { root, args, flags, report } = c;
  const verbs = await import("../todos/verbs.ts");
  try {
    const ask = !flags.json && process.stdin.isTTY && process.stdout.isTTY;
    const result = ask ? await (await import("../todos/wrapup.ts")).doneInTerminal(root, args.join(" ")) : verbs.done(root, args.join(" "));
    report(result, result.line);
    return 0;
  } catch (err) {
    return fail((err as Error).message);
  }
}

export async function loopsCommand(c: CliContext): Promise<number> {
  const { root, flags, json } = c;
  const { allLoops } = await import("../todos/loops.ts");
  const items = allLoops(loadAll(root), { done: flags.all ? undefined : false })
    .filter((l) => !flags.area || l.area === flags.area)
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  if (flags.json) json(items);
  else if (!items.length) out(pc.dim("No open to-dos."));
  else for (const todo of items) out(`${todo.done ? pc.dim("[x]") : "[ ]"} ${todo.text}${todo.due ? pc.cyan(`  due ${todo.due}`) : ""}${todo.every ? pc.cyan(`  every ${todo.every}`) : ""}${todo.outcome ? pc.dim(`  ${todo.outcome}`) : ""}  ${pc.dim(todo.path)}`);
  return 0;
}

export async function triageCommand(c: CliContext): Promise<number> {
  const { root } = c;
  const { triage } = await import("./menu.ts");
  return triage(root);
}
