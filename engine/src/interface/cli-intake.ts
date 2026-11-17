import { readFileSync } from "node:fs";
import pc from "picocolors";
import { brainDump } from "../capture/actions.ts";
import { summary } from "../core/notes.ts";
import { markStageDone, setLensPrivacy } from "../intake/lenses.ts";
import { redact, saveLensAnswer } from "../intake/lens-answers.ts";
import { addThread, listThreads, nextThread, updateThread } from "../intake/threads.ts";
import { intakeStatus, intakeStatusMarkdown } from "../intake/intake-status.ts";
import { addSubjectFact, intakePrompts, saveSubject, setRole } from "../intake/subjects.ts";
import { fileIntakeTodo } from "../intake/intake-todo.ts";
import { endSummary } from "../intake/intake-end.ts";
import { type CliContext, fail, out } from "./cli-shared.ts";

export async function intakeCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json, report } = c;
  const sub = args[0];
  if (sub === "status") {
    const st = intakeStatus(root);
    report(st, intakeStatusMarkdown(st));
    return 0;
  }
  if (sub === "save") {
    const [, lens, ...words] = args;
    const text = words.join(" ").trim() || (!process.stdin.isTTY ? readFileSync(0, "utf8").trim() : "");
    if (!lens || !text) return fail('Use: brain intake save <lens> "answer"');
    const facts = (flags.fact ?? []).map((f) => {
      const [into, ...t] = f.split("::");
      return { into: into.trim(), text: t.join("::").trim() };
    });
    if (facts.some((f) => !f.into || !f.text)) return fail('Use: --fact "<note>::<fact>" for a fact about a subject.');
    const note = saveLensAnswer(root, lens, text, { session: flags.session ? Number(flags.session) : undefined, quote: flags.quote, raw: flags.raw, question: flags.question, facts });
    report(summary(note), `${pc.green("Saved")} to ${note.path}`);
    return 0;
  }
  if (sub === "ask") {
    const text = args.slice(1).join(" ").trim() || (!process.stdin.isTTY ? readFileSync(0, "utf8").trim() : "");
    if (!text) return fail('Use: brain intake ask "what the owner just said"');
    const result = intakePrompts(root, text);
    if (flags.json) json(result);
    else {
      if (result.ask) out(result.ask.question);
      for (const x of result.offers) out(x.prompt);
      if (!result.ask && !result.offers.length) out("Nothing new to ask.");
    }
    return 0;
  }
  if (sub === "subject") {
    const name = args.slice(1).join(" ").trim();
    if (!name) return fail('Use: brain intake subject "Name" --type person --role "…" --about <note> --fact "first fact"');
    const result = saveSubject(root, { name, type: flags.type, role: flags.role, about: flags.about, fact: flags.fact?.[0], description: flags.description });
    report(result, result.skipped ? `Skipped ${name}. Nothing written.` : `${pc.green("Added")} ${result.path}`);
    return 0;
  }
  if (sub === "fact") {
    const [, into, ...words] = args;
    const text = words.join(" ").trim();
    if (!into || !text) return fail('Use: brain intake fact <note> "fact"');
    const path = addSubjectFact(root, into, text);
    report({ path }, `${pc.green("Added")} to ${path}`);
    return 0;
  }
  if (sub === "role") {
    const [, subject] = args;
    if (!subject || !flags.about) return fail('Use: brain intake role <subject> --about <note> --role "…"');
    const path = setRole(root, subject, flags.about, flags.role ?? "");
    report({ path }, `${pc.green("Fixed")} ${path}`);
    return 0;
  }
  if (sub === "todo") {
    const text = args.slice(1).join(" ").trim();
    if (!text) return fail('Use: brain intake todo "text" --when tomorrow --about <note>');
    const result = fileIntakeTodo(root, text, { when: flags.when, about: flags.about });
    report(result, `${pc.green("Added")} to ${result.into} as ${result.as === "note" ? "a note" : "a to-do"}.`);
    return 0;
  }
  if (sub === "end") {
    const result = endSummary(root);
    report(result, result.text.join("\n"));
    return 0;
  }
  if (sub === "redact") {
    const words = args.slice(1).join(" ").trim();
    if (!words) return fail('Use: brain intake redact "words to remove"');
    const result = redact(root, words);
    report(result, `${pc.green("Redacted")} ${result.lensLines} lens line${result.lensLines === 1 ? "" : "s"}, ${result.rawAnswers} raw answer${result.rawAnswers === 1 ? "" : "s"}, ${result.threads} thread${result.threads === 1 ? "" : "s"}.`);
    return 0;
  }
  if (sub === "privacy") {
    const [, lens, level] = args;
    if (!lens || !level) return fail("Use: brain intake privacy <lens> full|headline|skip");
    const note = setLensPrivacy(root, lens, level);
    report(summary(note), `${pc.green("Set")} ${lens} to ${level}`);
    return 0;
  }
  if (sub === "done") {
    if (!args[1]) return fail("Use: brain intake done <stage>");
    const st = markStageDone(root, args.slice(1).join(" "));
    report(st, `${pc.green("Done:")} stage ${st.n}, ${st.name}`);
    return 0;
  }
  const { intakeDump, intakeArea } = await import("./menu.ts");
  if (args[0]) return intakeArea(root, args[0]);
  if (!process.stdin.isTTY) {
    const notes = brainDump(root, readFileSync(0, "utf8"), { single: flags.single, area: flags.area });
    report(notes.map(summary), `${pc.green("Saved")} ${notes.length} note${notes.length === 1 ? "" : "s"} to inbox/.`);
    return 0;
  }
  return intakeDump(root);
}

export async function threadCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json, report } = c;
  const sub = args[0] ?? "list";
  if (sub === "add") {
    const question = args.slice(1).join(" ").trim();
    if (!question || !flags.lens) return fail('Use: brain thread add "question" --lens <lens>');
    const thread = addThread(root, { question, lens: flags.lens, area: flags.area, from: flags.from, depth: flags.depth ? Number(flags.depth) : undefined, privacy: flags.privacy, star: flags.star });
    report(thread, `${pc.green("Saved thread")} in ${thread.path}`);
    return 0;
  }
  if (sub === "list") {
    const items = listThreads(root, { status: flags.open ? "open" : flags.status, lens: flags.lens, area: flags.area });
    if (flags.json) json(items);
    else if (!items.length) out(pc.dim("No threads."));
    else for (const thread of items) out(`${thread.starred ? pc.yellow("* ") : "  "}${pc.bold(thread.question)}  ${pc.dim([thread.status, thread.lens, `depth ${thread.depth}`, thread.path].join(" · "))}`);
    return 0;
  }
  if (sub === "next") {
    const thread = nextThread(root, { lens: flags.lens });
    if (flags.json) json(thread ?? null);
    else out(thread ? `${pc.bold(thread.question)}\n  ${pc.dim([thread.lens, `depth ${thread.depth}`, thread.from && `from ${thread.from}`, thread.path].filter(Boolean).join(" · "))}` : pc.dim("No open threads."));
    return 0;
  }
  if (sub === "set") {
    const name = args.slice(1).join(" ");
    if (!name) return fail("Use: brain thread set <name> --status talked");
    const thread = updateThread(root, name, { status: flags.status, star: flags.star ? true : flags.unstar ? false : undefined });
    report(thread, `${pc.green("Updated")} "${thread.question}" in ${thread.path}`);
    return 0;
  }
  return fail(`Unknown thread command: ${sub}. Use add, list, next or set.`);
}
