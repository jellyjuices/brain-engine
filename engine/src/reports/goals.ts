// Goal and Decision views, computed on read from the notes. Nothing here is stored in a note.
//
// DECISION: percent = done / total over the goal's `# Targets` checklist lines plus its steps, plus the same for its subgoals
// (one level). A step is a to-do in the goal's own `# To-dos`, a to-do anywhere with `· toward` this goal, or a to-do in a
// Project linked to this goal in either direction. Each to-do counts once. Dropped lines do not count.
// DECISION: wins are computed, never written: a done target or a done `· toward` to-do is a win, dated by its `done` token.
// DECISION: "+N this month" counts both targets and steps done in the last 30 days.
// DECISION: the next step is the open to-do with the soonest due, else the first open target.

import { addDays, areasOf, descOf, extractLinks, folderOf, slugOf, str, titleOf, today, typeOf, DIRS, type Note } from "../core/notes.ts";
import { parentSlug } from "../core/schema-kinds.ts";
import { decisionsUnder } from "./decisions.ts";
import { fieldsOf, parseTodoLine, sectionRange } from "../../shared/line/index.ts";
import { byDue, TARGETS_HEADING, type GoalRef, type GoalStep, type GoalView, type GoalWin } from "../../shared/todos/index.ts";
import { relationsIn } from "../core/relations.ts";
import { allLoops } from "../todos/todos.ts";
import { ref } from "../todos/day-list.ts";

export const RECENT_DAYS = 30;

const percentOf = (done: number, total: number) => (total ? Math.round((100 * done) / total) : 0);
const isGoal = (n: Note) => typeOf(n) === "Goal" && n.path.startsWith("goals/");
const live = (n: Note) => folderOf(n) !== DIRS.archive;

function targetsOf(n: Note): GoalStep[] {
  const lines = n.body.split("\n");
  const range = sectionRange(lines, TARGETS_HEADING);
  if (!range) return [];
  const out: GoalStep[] = [];
  for (const line of lines.slice(range[0], range[1])) {
    const parsed = parseTodoLine(line);
    if (!parsed) continue;
    const f = fieldsOf(parsed);
    if (f.dropped) continue;
    out.push({ text: f.text, done: f.done, ...(f.doneAt && { doneAt: f.doneAt }), ...(f.due && { due: f.due }), path: n.path, goal: n.path });
  }
  return out;
}

type ProjectLinks = Map<string, Set<string>>;

function projectLinks(notes: Note[]): ProjectLinks {
  const goals = new Set(notes.filter(isGoal).map((n) => n.path));
  const projects = new Set(notes.filter((n) => typeOf(n) === "Project" && live(n)).map((n) => n.path));
  const out: ProjectLinks = new Map();
  for (const n of notes) {
    for (const r of relationsIn(n)) {
      const pair = goals.has(r.from) && projects.has(r.to) ? [r.from, r.to] : projects.has(r.from) && goals.has(r.to) ? [r.to, r.from] : undefined;
      if (pair) out.set(pair[0], (out.get(pair[0]) ?? new Set()).add(pair[1]));
    }
  }
  return out;
}

function stepsOf(notes: Note[], links: ProjectLinks, goal: string): GoalStep[] {
  const projects = links.get(goal);
  const out: GoalStep[] = [];
  for (const l of allLoops(notes)) {
    const mine = l.path === goal || projects?.has(l.path) || l.toward?.some((v) => extractLinks(l.path, v).includes(goal));
    if (l.dropped || !mine) continue;
    out.push({ text: l.text, done: l.done, ...(l.doneAt && { doneAt: l.doneAt }), ...(l.due && { due: l.due }), ...(l.every && { every: l.every }), path: l.path, goal, ref: ref(l.path, l.text) });
  }
  return out;
}

const uniq = (steps: GoalStep[]) => [...new Map(steps.map((s) => [`${s.path}\n${s.text}`, s])).values()];

const byDate = (a: { date?: string }, b: { date?: string }) => (b.date ?? "").localeCompare(a.date ?? "");

function winsOf(targets: GoalStep[], toward: GoalStep[]): GoalWin[] {
  const wins = [
    ...targets.filter((s) => s.done).map((s): GoalWin => ({ ...(s.doneAt && { date: s.doneAt }), text: s.text, kind: "target", path: s.path, goal: s.goal })),
    ...toward.filter((s) => s.done).map((s): GoalWin => ({ ...(s.doneAt && { date: s.doneAt }), text: s.text, kind: "todo", path: s.path, goal: s.goal })),
  ];
  return wins.sort(byDate);
}

function nextOf(targets: GoalStep[], toward: GoalStep[]): GoalStep | undefined {
  const open = toward.filter((s) => !s.done).sort(byDue);
  return open[0] ?? targets.find((s) => !s.done);
}

interface Own {
  note: Note;
  targets: GoalStep[];
  toward: GoalStep[];
}

const ownOf = (notes: Note[], links: ProjectLinks, n: Note): Own => ({ note: n, targets: targetsOf(n), toward: stepsOf(notes, links, n.path) });
const tally = (parts: Own[]) => {
  const steps = [...uniq(parts.flatMap((p) => p.targets)), ...uniq(parts.flatMap((p) => p.toward))];
  const done = steps.filter((s) => s.done).length;
  return { done, total: steps.length, percent: percentOf(done, steps.length) };
};

function goalRef(n: Note, parts: Own[]): GoalRef {
  return { path: n.path, title: titleOf(n), status: str(n.meta.status) ?? "active", ...tally(parts) };
}

function subgoalsOf(notes: Note[], n: Note): Note[] {
  return notes.filter((x) => isGoal(x) && live(x) && parentSlug(x) === slugOf(n)).sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
}

export function goalView(notes: Note[], path: string): GoalView | undefined {
  const n = notes.find((x) => x.path === path && isGoal(x));
  if (!n) return undefined;
  const links = projectLinks(notes);
  const own = ownOf(notes, links, n);
  const subs = subgoalsOf(notes, n).map((s) => ownOf(notes, links, s));
  const parts = [own, ...subs];
  const targets = uniq(parts.flatMap((p) => p.targets));
  const toward = uniq(parts.flatMap((p) => p.toward));
  const wins = winsOf(targets, toward);
  const since = addDays(today(), -RECENT_DAYS);
  const parent = parentSlug(n);
  const next = nextOf(own.targets, own.toward) ?? nextOf(targets, toward);
  return {
    ...goalRef(n, parts),
    description: descOf(n),
    why: str(n.meta.why) ?? "",
    areas: areasOf(n),
    ...(parent && { parent: `goals/${parent}.md` }),
    recent: wins.filter((w) => w.date && w.date >= since).length,
    ...(next && { next }),
    targets,
    toward,
    wins,
    subgoals: subs.map((s) => goalRef(s.note, [s])),
    decisions: decisionsUnder(notes, n.path),
  };
}

/** Every top-level goal with its percent. A subgoal shows under its parent only. */
export function goalList(notes: Note[]): GoalRef[] {
  const links = projectLinks(notes);
  return notes
    .filter((n) => isGoal(n) && live(n) && !parentSlug(n))
    .map((n) => goalRef(n, [ownOf(notes, links, n), ...subgoalsOf(notes, n).map((s) => ownOf(notes, links, s))]))
    .sort((a, b) => a.title.localeCompare(b.title));
}
