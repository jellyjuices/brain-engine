import { posix } from "node:path";
import { fileURLToPath } from "node:url";
import { areasOf, folderOf, str, tagsOf, titleOf, typeOf, type Note } from "../../src/core/notes.ts";
import { subjectsNamed } from "../../src/capture/file.ts";
import { captureText } from "../../src/todos/absorb.ts";
import { newTodoLine, toOutcome } from "../../shared/line/index.ts";

export const GENERAL = "areas/general.md";
export const STARTER_GENERAL = fileURLToPath(new URL("../../starter/areas/general.md", import.meta.url));

const OLD_OUTCOMES: Record<string, string> = { "do-now": "today", park: "someday", parked: "someday", "hand-off": "waiting" };
const isPerson = (n: Note) => typeOf(n) === "Person";

export interface CaptureMove {
  capture: string;
  line: string;
  people: number;
  undated: boolean;
}

function peopleIn(notes: Note[], cap: Note): Note[] | undefined {
  if (folderOf(cap) !== "inbox" || typeOf(cap) !== "Capture") return undefined;
  const outcome = str(cap.meta.outcome);
  if (outcome === "keep" || outcome === "drop") return undefined;
  if (areasOf(cap).length || tagsOf(cap).length) return undefined;
  if (cap.links.some((l) => !l.startsWith("people/"))) return undefined;
  const linked = notes.filter((n) => cap.links.includes(n.path));
  const named = subjectsNamed(notes, captureText(cap));
  const all = [...new Set([...linked, ...named])];
  return all.length && all.every(isPerson) ? all : undefined;
}

const linkTo = (person: Note) => `[${titleOf(person).split(",")[0]}](${posix.relative(posix.dirname(GENERAL), person.path)})`;

export function captureMove(notes: Note[], cap: Note): CaptureMove | undefined {
  const people = peopleIn(notes, cap);
  if (!people) return undefined;
  const word = str(cap.meta.outcome);
  const outcome = toOutcome(word && Object.hasOwn(OLD_OUTCOMES, word) ? OLD_OUTCOMES[word] : word);
  const due = str(cap.meta.due)?.slice(0, 10);
  const line = newTodoLine({
    text: captureText(cap),
    ...(due && { due }),
    ...(outcome && outcome !== "today" && { outcome }),
    with: people.map(linkTo),
  });
  return { capture: cap.path, line, people: people.length, undated: outcome === "today" && !due };
}
