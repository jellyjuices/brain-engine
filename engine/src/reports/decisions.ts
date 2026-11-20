// The Decision view, computed on read. A decision links to a goal through its `# Goals` relation section.

import { descOf, DIRS, folderOf, str, titleOf, typeOf, type Note } from "../core/notes.ts";
import { relationsIn } from "../core/relations.ts";
import { sectionRange } from "../../shared/line/index.ts";
import type { DecisionRef } from "../../shared/todos/index.ts";
import { ref } from "../todos/day-list.ts";

export interface DecisionView extends DecisionRef {
  description: string;
  subjects: string[];
  goals: { path: string; title: string }[];
  todo?: { text: string; due: string; ref: string };
  decided: string;
}

const isDecision = (n: Note) => typeOf(n) === "Decision" && n.path.startsWith("decisions/");

function decisionRef(n: Note): DecisionRef {
  const by = str(n.meta.decide_by)?.slice(0, 10);
  return { path: n.path, title: titleOf(n), status: str(n.meta.status) ?? "open", ...(by && { decide_by: by }) };
}

/** Decisions whose `# Goals` section links to this goal. */
export function decisionsUnder(notes: Note[], goal: string): DecisionRef[] {
  return notes
    .filter((n) => isDecision(n) && folderOf(n) !== DIRS.archive && relationsIn(n).some((r) => r.heading === "Goals" && r.to === goal))
    .map(decisionRef)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function decisionView(notes: Note[], path: string): DecisionView | undefined {
  const n = notes.find((x) => x.path === path && isDecision(x));
  if (!n) return undefined;
  const base = decisionRef(n);
  const byPath = new Map(notes.map((x) => [x.path, x]));
  const goals = relationsIn(n)
    .filter((r) => r.heading === "Goals" && byPath.has(r.to))
    .map((r) => ({ path: r.to, title: titleOf(byPath.get(r.to)!) }));
  const lines = n.body.split("\n");
  const range = sectionRange(lines, "# Decided");
  const decided = range ? lines.slice(range[0], range[1]).join("\n").trim() : "";
  const open = !["decided", "dropped"].includes(base.status) && base.decide_by;
  const text = `Decide: ${base.title}`;
  return {
    ...base,
    description: descOf(n),
    subjects: (Array.isArray(n.meta.subjects) ? n.meta.subjects : []).map(String),
    goals,
    ...(open && { todo: { text, due: base.decide_by!, ref: ref(n.path, text) } }),
    decided,
  };
}
