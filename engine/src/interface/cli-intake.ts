import { readFileSync } from "node:fs";
import pc from "picocolors";
import { brainDump } from "../capture/actions.ts";
import { summary } from "../core/notes.ts";
import { markStageDone, setLensPrivacy } from "../intake/lenses.ts";
import { redact, saveLensAnswer } from "../intake/lens-answers.ts";
import { intakeStatus, intakeStatusMarkdown } from "../intake/intake-status.ts";
import { addSubjectFact, intakePrompts, setRole } from "../intake/subjects.ts";
import { saveSubject } from "../intake/subject-save.ts";
import { fileIntakeTodo } from "../intake/intake-todo.ts";
import { endSummary } from "../intake/intake-end.ts";
import { type CliContext, fail, out, plural, restText } from "./cli-shared.ts";

type Handler = (c: CliContext) => number;

const pipedText = () => (process.stdin.isTTY ? "" : readFileSync(0, "utf8").trim());

function parseFacts(raw: string[] = []) {
  return raw.map((f) => {
    const [into, ...t] = f.split("::");
    return { into: into.trim(), text: t.join("::").trim() };
  });
}

function save(c: CliContext): number {
  const { root, args, flags, report } = c;
  const [, lens, ...words] = args;
  const text = words.join(" ").trim() || pipedText();
  if (!lens || !text) return fail('Use: brain intake save <lens> "answer"');
  const facts = parseFacts(flags.fact);
  if (facts.some((f) => !f.into || !f.text)) return fail('Use: --fact "<note>::<fact>" for a fact about a subject.');
  const session = flags.session ? Number(flags.session) : undefined;
  const note = saveLensAnswer(root, lens, text, { session, quote: flags.quote, raw: flags.raw, question: flags.question, facts });
  report(summary(note), `${pc.green("Saved")} to ${note.path}`);
  return 0;
}

function printPrompts(result: ReturnType<typeof intakePrompts>) {
  if (result.ask) out(result.ask.question);
  for (const x of result.offers) out(x.prompt);
  if (!result.ask && !result.offers.length) out("Nothing new to ask.");
}

function ask(c: CliContext): number {
  const text = restText(c.args) || pipedText();
  if (!text) return fail('Use: brain intake ask "what the owner just said"');
  const result = intakePrompts(c.root, text);
  if (c.flags.json) c.json(result);
  else printPrompts(result);
  return 0;
}

function subject(c: CliContext): number {
  const { root, args, flags, report } = c;
  const name = restText(args);
  if (!name) return fail('Use: brain intake subject "Name" --type person --role "…" --about <note> --fact "first fact"');
  const result = saveSubject(root, { name, type: flags.type, role: flags.role, about: flags.about, fact: flags.fact?.[0], description: flags.description });
  report(result, result.skipped ? `Skipped ${name}. Nothing written.` : `${pc.green("Added")} ${result.path}`);
  return 0;
}

function fact(c: CliContext): number {
  const [, into, ...words] = c.args;
  const text = words.join(" ").trim();
  if (!into || !text) return fail('Use: brain intake fact <note> "fact"');
  const path = addSubjectFact(c.root, into, text);
  c.report({ path }, `${pc.green("Added")} to ${path}`);
  return 0;
}

function role(c: CliContext): number {
  const { root, args, flags, report } = c;
  if (!args[1] || !flags.about) return fail('Use: brain intake role <subject> --about <note> --role "…"');
  const path = setRole(root, args[1], flags.about, flags.role ?? "");
  report({ path }, `${pc.green("Fixed")} ${path}`);
  return 0;
}

function todo(c: CliContext): number {
  const text = restText(c.args);
  if (!text) return fail('Use: brain intake todo "text" --when tomorrow --about <note>');
  const result = fileIntakeTodo(c.root, text, { when: c.flags.when, about: c.flags.about });
  c.report(result, `${pc.green("Added")} to ${result.into} as ${result.as === "note" ? "a note" : "a to-do"}.`);
  return 0;
}

function end(c: CliContext): number {
  const result = endSummary(c.root);
  c.report(result, result.text.join("\n"));
  return 0;
}

function redactWords(c: CliContext): number {
  const words = restText(c.args);
  if (!words) return fail('Use: brain intake redact "words to remove"');
  const r = redact(c.root, words);
  c.report(r, `${pc.green("Redacted")} ${plural(r.lensLines, "lens line")}, ${plural(r.rawAnswers, "raw answer")}, ${plural(r.threads, "thread")}.`);
  return 0;
}

function privacy(c: CliContext): number {
  const [, lens, level] = c.args;
  if (!lens || !level) return fail("Use: brain intake privacy <lens> full|headline|skip");
  const note = setLensPrivacy(c.root, lens, level);
  c.report(summary(note), `${pc.green("Set")} ${lens} to ${level}`);
  return 0;
}

function done(c: CliContext): number {
  if (!c.args[1]) return fail("Use: brain intake done <stage>");
  const st = markStageDone(c.root, c.args.slice(1).join(" "));
  c.report(st, `${pc.green("Done:")} stage ${st.n}, ${st.name}`);
  return 0;
}

function status(c: CliContext): number {
  const st = intakeStatus(c.root);
  c.report(st, intakeStatusMarkdown(st));
  return 0;
}

function dump(c: CliContext): number {
  if (c.args[0] || process.stdin.isTTY) return fail("Use: brain intake <status|save|ask|subject|fact|role|todo|end|redact|privacy|done>, or pipe text in: one line is one note.");
  const notes = brainDump(c.root, readFileSync(0, "utf8"), { single: c.flags.single, area: c.flags.area });
  c.report(notes.map(summary), `${pc.green("Saved")} ${plural(notes.length, "note")} to inbox/.`);
  return 0;
}

const INTAKE: Record<string, Handler> = { status, save, ask, subject, fact, role, todo, end, redact: redactWords, privacy, done };

export async function intakeCommand(c: CliContext): Promise<number> {
  return (INTAKE[c.args[0] ?? ""] ?? dump)(c);
}
