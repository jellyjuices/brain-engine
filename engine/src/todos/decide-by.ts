import { str, titleOf, typeOf, type Note } from "../core/notes.ts";
import { areasOfNote, live, type Loop } from "./todos.ts";

const CLOSED = ["decided", "dropped"];

/** An open Decision with a `decide_by` date counts as one to-do on that date, with no line in the note. */
export function decideByLoops(notes: Note[]): Loop[] {
  const out: Loop[] = [];
  for (const n of notes) {
    if (typeOf(n) !== "Decision" || !live(n) || CLOSED.includes(str(n.meta.status) ?? "open")) continue;
    const due = str(n.meta.decide_by)?.slice(0, 10);
    if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) continue;
    const areas = areasOfNote(n);
    out.push({ text: `Decide: ${titleOf(n)}`, done: false, due, path: n.path, noteTitle: titleOf(n), area: areas[0], ...(areas.length > 1 && { areas }) });
  }
  return out;
}
