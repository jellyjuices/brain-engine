import type { Note } from "../core/notes.ts";
import { typeOf } from "../core/notes.ts";
import { decisionView, type DecisionView } from "./decisions.ts";
import { goalView, type GoalView } from "./goals.ts";

export function goalLines(v: GoalView): string[] {
  const out = [`${v.title}  (Goal · ${v.path})`, `  ${v.percent}%  ${v.done} of ${v.total} done${v.recent ? `  +${v.recent} this month` : ""}`];
  if (v.next) out.push(`  Next: ${v.next.text}${v.next.due ? ` · due ${v.next.due}` : ""}`);
  const section = (name: string, lines: string[]) => lines.length && out.push("", name, ...lines.map((l) => `  ${l}`));
  section("Targets", v.targets.map((t) => `- [${t.done ? "x" : " "}] ${t.text}${t.doneAt ? ` · ${t.doneAt}` : ""}`));
  section("To-dos toward it", v.toward.filter((t) => !t.done).map((t) => `- ${t.text}${t.due ? ` · due ${t.due}` : ""}`));
  section("Wins", v.wins.map((w) => `${w.date ?? "undated"} · ${w.text}`));
  section("Subgoals", v.subgoals.map((s) => `${s.percent}%  ${s.title}`));
  section("Decisions", v.decisions.map((d) => `${d.title} · ${d.status}${d.decide_by ? ` · decide by ${d.decide_by}` : ""}`));
  return out;
}

export function decisionLines(v: DecisionView): string[] {
  const out = [`${v.title}  (Decision · ${v.path})`, `  ${v.status}${v.decide_by ? ` · decide by ${v.decide_by}` : ""}`];
  if (v.goals.length) out.push("", "Goals", ...v.goals.map((g) => `  ${g.title}`));
  if (v.decided) out.push("", "Decided", ...v.decided.split("\n").map((l) => `  ${l}`));
  return out;
}

/** The goal or decision view for a note, with plain lines, or undefined for any other note. */
export function kindView(notes: Note[], n: Note): { view: GoalView | DecisionView; lines: string[] } | undefined {
  if (typeOf(n) === "Goal") {
    const view = goalView(notes, n.path);
    return view && { view, lines: goalLines(view) };
  }
  if (typeOf(n) === "Decision") {
    const view = decisionView(notes, n.path);
    return view && { view, lines: decisionLines(view) };
  }
  return undefined;
}
