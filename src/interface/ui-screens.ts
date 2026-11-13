import * as p from "@clack/prompts";
import pc from "picocolors";
import { capture } from "../capture/actions.ts";
import { buildCard, isSubject, matchSubject } from "../reports/card.ts";
import { type Note, titleOf, typeOf } from "../core/notes.ts";
import { loadAll, readNote } from "../core/files.ts";
import { move } from "../todos/verbs.ts";
import { ref as todoRef } from "../todos/day-list.ts";
import { change } from "../todos/undo.ts";
import { parseWhen } from "../todos/when-words.ts";
import { fileInto, smartAdd, splitPrefix, subjectsNamed, type When } from "../capture/file.ts";
import { listThreads, nextThread } from "../intake/threads.ts";
import { ask, BACK, intakeDump, render } from "./menu.ts";
import { search } from "../core/search.ts";
import { doneInTerminal, dropInTerminal } from "../todos/wrapup.ts";
import { addedLine, cardView, clip, comingUp, HELP_LINES, INTAKE_OPTIONS, MORE_OPTIONS, type Opt, todoActionOptions, todoLabel } from "./ui-view.ts";
import { openInEditor, pick, run, tidy, width } from "./ui-prompts.ts";

export async function todoScreen(root: string, ref: string, text: string, path: string, subject: string): Promise<boolean> {
  const hasNote = loadAll(root).some((n) => n.path === path);
  const act = await pick(todoLabel(text, subject, width() - 4), todoActionOptions(hasNote ? subject : undefined));
  if (act === BACK) return false;
  if (act === "done") {
    const result = await run(root, () => doneInTerminal(root, ref));
    if (result?.followUp) p.log.info(`Follow-up added to ${titleOf(readNote(root, result.followUp.into))}.`);
    return !!result;
  }
  if (act === "drop") return !!(await run(root, () => dropInTerminal(root, ref)));
  if (act === "tomorrow" || act === "someday") return !!(await run(root, () => move(root, ref, act)));
  if (act === "day") {
    const answer = await ask(
      p.text({
        message: "Which day?",
        placeholder: "fri, tomorrow, nov 20 or 2026-11-20",
        validate: (v) => {
          try { parseWhen(v ?? ""); } catch (err) { return (err as Error).message; }
        },
      }),
    );
    if (answer === BACK) return false;
    return !!(await run(root, () => move(root, ref, answer.trim())));
  }
  if (act === "card") await cardScreen(root, path);
  return false;
}

export async function addScreen(root: string) {
  const text = await ask(p.text({ message: "Add", placeholder: "tomorrow: call Omar · note: GP retires · or just type" }));
  if (text === BACK || !text.trim()) return;
  try {
    const notes = loadAll(root);
    const result = smartAdd(root, notes, text.trim());
    if (result.filed) {
      p.log.success(addedLine(titleOf(readNote(root, result.into)), splitPrefix(text).when));
    } else {
      capture(root, { text: result.text });
      p.log.success("Added to the inbox.");
    }
    tidy(root);
  } catch (err) {
    p.log.error((err as Error).message);
  }
}

/** A note that is not a subject: its text, then the editor. */
async function noteScreen(root: string, path: string) {
  const note = readNote(root, path);
  p.note(render(note.body) || pc.dim("(empty)"), titleOf(note));
  const answer = await pick("Open", [{ value: "edit", label: "Edit the note" }]);
  if (answer === "edit") openInEditor(root, path);
}

/** A subject card: what is on it, its to-dos you can act on, Add here, a linked subject, Edit the note. */
async function cardScreen(root: string, path: string): Promise<void> {
  for (;;) {
    const notes = loadAll(root);
    const note = notes.find((x) => x.path === path);
    if (!note) return void p.log.warn("That note is gone.");
    if (!isSubject(note)) return noteScreen(root, path);
    const card = buildCard(root, notes, note);
    p.log.message(cardView(card).join("\n"));
    const links = [...card.relations, ...card.related].map((r) => ({ path: r.path, title: r.title })).filter((l, i, all) => all.findIndex((x) => x.path === l.path) === i);
    const opts: Opt[] = [
      ...card.todo.map((t, i) => ({ value: `t${i}`, label: todoLabel(t.text, t.path === path ? undefined : t.noteTitle, width() - 6) })),
      { value: "add", label: "+ Add here" },
      ...(links.length ? [{ value: "links", label: "Open a linked subject" }] : []),
      { value: "edit", label: "Edit the note" },
    ];
    const answer = await pick(card.subject.title, opts);
    if (answer === BACK) return;
    if (answer === "edit") openInEditor(root, path);
    else if (answer === "add") await addHere(root, path, notes);
    else if (answer === "links") {
      const to = await pick("Open", links.map((l) => ({ value: l.path, label: l.title })));
      if (to !== BACK) await cardScreen(root, to);
    } else {
      const todo = card.todo[Number(answer.slice(1))];
      await todoScreen(root, todoRef(todo.path, todo.text), todo.text, todo.path, todo.noteTitle);
    }
  }
}

/** Add a to-do or note line to one subject. No prefix means a to-do for today. One undo reverses it. */
async function addHere(root: string, path: string, notes: Note[]) {
  const text = await ask(p.text({ message: "Add here", placeholder: "fri: call · note: a fact · or just type" }));
  if (text === BACK || !text.trim()) return;
  const { when, text: body } = splitPrefix(text);
  const w: When = when ?? { kind: "today" };
  const hits = subjectsNamed(notes, body).filter((x) => x.path !== path);
  const people = hits.filter((x) => typeOf(x) === "Person").map((x) => x.path);
  const re = hits.filter((x) => typeOf(x) !== "Person").map((x) => x.path);
  try {
    change(root, path, `added to ${path}: ${body}`, () => { fileInto(root, notes, path, body, w, { with: people, re }); });
    p.log.success(addedLine(titleOf(readNote(root, path)), w));
    tidy(root);
  } catch (err) {
    p.log.error((err as Error).message);
  }
}

export async function findScreen(root: string) {
  const answer = await ask(p.text({ message: "Find", placeholder: "a name or a word: dentist, invoice, Omar…" }));
  if (answer === BACK || !answer.trim()) return;
  const notes = loadAll(root);
  const subject = matchSubject(notes, answer);
  const rest = search(root, answer).filter((h) => h.path !== subject?.path);
  if (!subject && !rest.length) return void p.log.warn("Nothing found.");
  if (subject) await cardScreen(root, subject.path);
  if (!rest.length) return;
  const opts: Opt[] = rest.map((h) => ({ value: h.path, label: clip(`${h.title}${h.type ? ` · ${h.type}` : ""}`, width() - 6) }));
  for (;;) {
    const answer = await pick(`${rest.length} found`, opts);
    if (answer === BACK) return;
    await cardScreen(root, answer);
  }
}

async function intakeScreen(root: string) {
  for (;;) {
    const answer = await pick("Intake", INTAKE_OPTIONS);
    if (answer === BACK) return;
    if (answer === "next") {
      const thread = nextThread(root);
      p.log.message(thread ? `${thread.question}${thread.lens ? pc.dim(`  (${thread.lens})`) : ""}` : "No open questions.");
    } else if (answer === "dump") await intakeDump(root, false);
    else if (answer === "questions") {
      const items = listThreads(root, { status: "open" });
      if (!items.length) { p.log.info("No open questions."); continue; }
      const answer = await pick(`${items.length} open`, items.map((x) => ({ value: x.path, label: clip(x.question || x.title, width() - 6) })));
      if (answer !== BACK) await noteScreen(root, answer);
    }
  }
}

export async function moreScreen(root: string) {
  for (;;) {
    const answer = await pick("More", MORE_OPTIONS);
    if (answer === BACK) return;
    try {
      if (answer === "review") await (await import("../todos/review.ts")).runReview(root);
      else if (answer === "intake") await intakeScreen(root);
      else if (answer === "coming") {
        const rows = comingUp(loadAll(root));
        p.log.message(rows.length ? rows.join("\n") : "Nothing in the next 14 days.");
      } else if (answer === "help") p.log.message(HELP_LINES.join("\n"));
      tidy(root);
    } catch (err) {
      p.log.error((err as Error).message);
    }
  }
}

/** The app. Returns an exit code. */
