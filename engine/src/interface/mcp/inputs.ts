// The input of every tool, keyed by the route's tool name. Body routes use the request types in api-types.ts.
// Query routes and the older phone routes have no shared type yet, so their shapes are named here.

import { type AddRelationRequest, type AddRequest, type DeleteTodoRequest, type DoneRequest, DRAFT_KINDS, type MakeNoteRequest, type MoveRequest, type SaveDraftRequest, type SortBitRequest, type SortRequest, type DraftKind } from "../api-types.ts";
import { TODO_VIEWS, type TodoView } from "../../../shared/todos/index.ts";
import { type Input, int, NONE, obj, oneOf, req, shape, str, strs } from "./schema.ts";

interface Words { q: string; limit?: number }
interface Filters { type?: string; tag?: string; area?: string; status?: string; limit?: number }
interface NotePath { path: string }
interface DraftId { id: string }
interface EditNote { path: string; body?: string; base: string; tags?: string[]; title?: string; status?: string }
interface Person { name: string; birthday?: string; description?: string }
interface Journal { date: string; text: string; about?: string; title?: string; created_at?: string; client_id?: string }
interface Subject { type: string; name: string }
interface TextFile { title: string; text: string }
interface Birthday { path: string; birthday: string }
interface TodoWords { ref: string; text: string }
interface IntakeSave { lens: string; question: string; line: string; by?: string; raw?: string }

const REF = "A to-do ref from todos or today.";
const WHEN = "today, tomorrow, someday, waiting, note, or a date like 2026-05-04.";
const PATH = "A note path, like people/dana-cole.md.";
const PATHS = "Note paths.";
const BY = "Your name. It goes on the generated label.";

const add = obj<AddRequest>({
  client_id: req(str("Any unique id. A retry with the same id makes no copy.")),
  text: req(str()),
  created_at: str("ISO time."),
  into: str("A note path to file it in."),
  about: { description: "Note paths. With kind feeling, the side: what it is about, in the owner's words.", oneOf: [strs(PATHS), str()] },
  people: strs("Person note paths."),
  tags: strs(),
  by: str(BY),
  draft_id: str(),
  when: str(WHEN),
  kind: oneOf(["todo", "journal", "fact", "feeling"], "todo writes a to-do line. journal keeps the text whole as its own note, to sort later. fact and feeling write one dated line into into."),
  title: str("A journal note's title. With none, the first words."),
});

const bit = shape<SortBitRequest>({
  into: req(str(PATH)),
  when: req(str(WHEN)),
  text: str(),
  with: strs("Person note paths."),
  re: strs(PATHS),
  kind: oneOf(["to-do", "fact", "feeling", "decision"]),
  about: str("What it is about, in the owner's words. A feeling needs it."),
});

const filters = { type: str("A note type."), tag: str(), area: str(), status: str(), limit: int() };
const notePath = (rest: boolean) => obj<NotePath>({ path: req(str(PATH)) }, rest ? "path" : undefined);
const draftId = obj<DraftId>({ id: req(str()) }, "id");

export const INPUTS: Record<string, Input> = {
  add,
  inbox: add,
  done: obj<DoneRequest>({ ref: req(str(REF)), happened: str("What happened."), follow_up: str("The next to-do.") }),
  move: obj<MoveRequest>({ ref: req(str(REF)), when: req(str(WHEN)), who: str("Who it waits on."), what: str() }),
  delete_todo: obj<DeleteTodoRequest>({ ref: req(str(REF)), why: str() }),
  edit_todo: obj<TodoWords>({ ref: req(str(REF)), text: req(str("The new words, with no date or tags.")) }),
  reopen: obj<{ ref: string }>({ ref: req(str(REF)) }),
  undo: NONE,
  find: obj<Filters & Words>({ q: req(str()), ...filters }),
  todos: obj<{ view?: TodoView }>({ view: oneOf(TODO_VIEWS) }),
  today: NONE,
  read_note: notePath(true),
  goals: NONE,
  goal: obj<NotePath>({ path: req(str("A goal slug or path, like goals/run-far.md.")) }, "path"),
  decision: obj<NotePath>({ path: req(str("A decision slug or path, like decisions/move-city.md.")) }, "path"),
  sort: obj<SortRequest>({
    path: req(str("A path from unsorted: a capture in inbox/ or a journal note in journal/.")),
    into: str(PATH),
    when: str(WHEN),
    bits: { type: "array", items: bit, minItems: 1, description: "Instead of into and when, one entry per line." },
    draft_id: str(),
  }),
  unsorted: NONE,
  make_note: obj<MakeNoteRequest>({
    type: req(str("A note type, like Goal, Decision or Project.")),
    title: req(str()),
    description: str(),
    draft_id: str(),
    fields: { type: "object", description: "Any of why, when, date, with, decide_by, subjects, birthday, from, renews, status. Text, or a list of text.", additionalProperties: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] } },
    areas: strs("Area slugs, like health."),
    parent: str("A goal path or slug. The new goal is its subgoal."),
    sections: { type: "object", description: "Lines under headings, like { \"# Targets\": [\"- [ ] Run 5 km\"] }.", additionalProperties: { type: "array", items: { type: "string" } } },
    relations: { type: "array", description: "Links written in the new note.", items: shape<{ to: string; role?: string; time?: string }>({ to: req(str(PATH)), role: str(), time: str() }) },
    todos: { type: "array", description: "To-dos under # To-dos. Text, or an object.", items: { oneOf: [{ type: "string" }, shape<{ text: string; when?: string; toward?: string }>({ text: req(str()), when: str(WHEN), toward: str("A goal path this to-do is toward.") })] } },
  }),
  delete_note: notePath(true),
  edit_note: obj<EditNote>({ path: req(str(PATH)), body: str("The whole new body. Leave it out to keep the body."), base: req(str("The hash from read_note.")), tags: strs(), title: str("A new title. Journal notes only. The path stays."), status: str("A new status the note type allows, like finished for a Project.") }, "path"),
  relations: notePath(false),
  add_relation: obj<AddRelationRequest>({ from: req(str(PATH)), to: req(str(PATH)), role: str(), time: str() }),
  log: obj<{ n?: number }>({ n: int("How many, up to 200.") }),
  drafts: obj<{ kind?: DraftKind }>({ kind: oneOf(DRAFT_KINDS) }),
  save_draft: obj<SaveDraftRequest>({ id: str(), kind: req(oneOf(DRAFT_KINDS)), step: str(), data: req({ type: "object" }) }),
  read_draft: draftId,
  delete_draft: draftId,
  notes_since: obj<{ since?: string }>({ since: str("ISO time.") }),
  card: obj<{ q: string }>({ q: req(str()) }),
  list: obj<Filters>(filters),
  calendar: NONE,
  report: obj<{ name: string }>({ name: req(str("today, weekly or area/<slug>.")) }, "name"),
  add_person: obj<Person>({ name: req(str()), birthday: str("Like 1990-05-04."), description: str() }),
  add_journal: obj<Journal>({ date: req(str("Like 2026-05-04.")), text: req(str()), about: str(PATH), title: str(), created_at: str("ISO time. Its HH:MM goes in the path."), client_id: str("Any unique id. A retry with the same id makes no copy, even if the text was edited.") }),
  add_subject: obj<Subject>({ type: req(oneOf(["Place", "Thing"])), name: req(str()) }),
  drop_capture: notePath(false),
  add_file: obj<TextFile>({ title: req(str()), text: req(str()) }),
  set_birthday: obj<Birthday>({ path: req(str(PATH)), birthday: req(str("Like 1990-05-04.")) }),
  intake_next: NONE,
  intake_save: obj<IntakeSave>({ lens: req(str()), question: req(str()), line: req(str()), by: str(), raw: str() }),
  intake_skip: obj<{ question: string }>({ question: req(str()) }),
};
