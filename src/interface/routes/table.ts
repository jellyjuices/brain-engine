// Every `brain serve` route in one table. The MCP layer reads it: one tool per route, named by `tool`.
// DECISION: a to-do ref is the stable `path::text` string (an event's ref is its note path). List numbers are only for the terminal.

import { calendarFeed } from "../../todos/calendar.ts";
import { HttpError } from "../server-auth.ts";
import { type Ctx, TextBody } from "../server-context.ts";
import { addFile, addJournal, addPerson, addSubject, doneRoute, dropRoute, editNote, inboxDrop, moveRoute, setBirthday, undoRoute } from "../server-writes.ts";
import { cardRoute, intakeNext, intakeSave, intakeSkip, listRoute, notesSince, oneNote, report, searchRoute, todayRoute } from "../server-reads.ts";
import { newAgentToken, revokeAgent } from "./agent.ts";
import { addRoute, sortRoute, unsortedRoute } from "./capture.ts";
import { decisionRoute, goalRoute, goalsRoute } from "./goals.ts";
import { dropDraft, listDrafts, oneDraft, saveDraft } from "./drafts.ts";
import { addRelation, deleteNote, makeNote, relationsRoute } from "./notes.ts";
import { findRoute, logRoute, todosRoute } from "./reads.ts";

export type Method = "GET" | "POST" | "PUT" | "DELETE";
export type Handler = (c: Ctx, rest: string) => unknown;

export interface Route {
  method: Method;
  path: string;
  /** The path is a prefix; the rest of the URL is passed to the handler. */
  prefix?: boolean;
  tool: string;
  summary: string;
  handler: Handler;
  /** Only the owner may call it, never an agent token. */
  owner?: boolean;
}

const r = (method: Method, path: string, tool: string, summary: string, handler: Handler, extra: Partial<Route> = {}): Route => ({ method, path, tool, summary, handler, ...extra });

export const ROUTES: Route[] = [
  r("POST", "/api/add", "add", "Add a thought. With a tag, person or subject it is filed at once; else it waits in the inbox.", addRoute),
  r("POST", "/api/done", "done", "Tick a to-do, with an optional note and follow-up.", doneRoute),
  r("POST", "/api/move", "move", "Give a to-do a new When.", moveRoute),
  r("POST", "/api/drop", "delete_todo", "Delete a to-do. It stays on the timeline as dropped.", dropRoute),
  r("POST", "/api/undo", "undo", "Undo the last change. A whole sort is one change.", undoRoute),
  r("GET", "/api/find", "find", "Find notes by words, with the subject card when the words name one.", findRoute),
  r("GET", "/api/todos", "todos", "One to-do view: today, soon, no-date, on-hold, by-goal or all.", todosRoute),
  r("GET", "/api/today", "today", "Today: overdue and due to-dos and events.", todayRoute),
  r("GET", "/api/notes/", "read_note", "Read one note with its backlinks and card.", oneNote, { prefix: true }),
  r("GET", "/api/goals", "goals", "Every goal with its percent. A subgoal counts toward its parent.", goalsRoute),
  r("GET", "/api/goals/", "goal", "One goal: percent, targets, to-dos toward it, wins, subgoals and decisions.", goalRoute, { prefix: true }),
  r("GET", "/api/decisions/", "decision", "One decision: status, decide-by to-do, goals and what was decided.", decisionRoute, { prefix: true }),
  r("POST", "/api/sort", "sort", "Sort a capture into one or more subjects. The capture is deleted.", sortRoute),
  r("GET", "/api/unsorted", "unsorted", "How many captures wait, and which.", unsortedRoute),
  r("POST", "/api/notes", "make_note", "Make a note from a type and a title.", makeNote),
  r("DELETE", "/api/notes/", "delete_note", "Delete a note. It moves to the archive.", deleteNote, { prefix: true }),
  r("PUT", "/api/notes/", "edit_note", "Save an edited note body. Needs the hash it was read at.", editNote, { prefix: true }),
  r("GET", "/api/relations", "relations", "The relations of one note, both ways.", relationsRoute),
  r("POST", "/api/relations", "add_relation", "Link two notes, with an optional role and time.", addRelation),
  r("GET", "/api/log", "log", "The last changes, newest first, and which can be undone.", logRoute),
  r("GET", "/api/drafts", "drafts", "Saved adds, sorts and builders that were cut off.", listDrafts),
  r("POST", "/api/drafts", "save_draft", "Save a step of an add, sort or builder so it can resume.", saveDraft),
  r("GET", "/api/drafts/", "read_draft", "One saved draft.", oneDraft, { prefix: true }),
  r("DELETE", "/api/drafts/", "delete_draft", "Delete a saved draft.", dropDraft, { prefix: true }),
  r("POST", "/api/agent-token", "agent_token", "Make a new agent token. Owner only.", newAgentToken, { owner: true }),
  r("DELETE", "/api/agent-token", "revoke_agent_token", "Revoke the agent token. Owner only.", revokeAgent, { owner: true }),
  r("GET", "/api/notes", "notes_since", "Notes changed since a time, for the app's copy.", notesSince),
  r("GET", "/api/search", "search", "Search hits only.", searchRoute),
  r("GET", "/api/card", "card", "The subject card for some words.", cardRoute),
  r("GET", "/api/list", "list", "List notes by type, tag, area or status.", listRoute),
  r("GET", "/api/cal.ics", "calendar", "The calendar feed.", (c) => new TextBody(calendarFeed(c.root), "text/calendar; charset=utf-8")),
  r("GET", "/api/reports/", "report", "A report: today, weekly or area/<slug>.", report, { prefix: true }),
  r("POST", "/api/inbox", "inbox", "The app's add. Same as /api/add.", addRoute),
  r("POST", "/api/people", "add_person", "Make a Person note.", addPerson),
  r("POST", "/api/journal", "add_journal", "Make a journal note for a day.", addJournal),
  r("POST", "/api/subjects", "add_subject", "Make a Place or Thing note.", addSubject),
  r("POST", "/api/inbox-drop", "drop_capture", "Take a capture out of the inbox into the archive.", inboxDrop),
  r("POST", "/api/files", "add_file", "A text file becomes a note.", addFile),
  r("POST", "/api/birthday", "set_birthday", "Set a person's birthday.", setBirthday),
  r("GET", "/api/intake/next", "intake_next", "Open intake questions.", intakeNext),
  r("POST", "/api/intake/save", "intake_save", "Save an intake answer.", intakeSave),
  r("POST", "/api/intake/skip", "intake_skip", "Park an intake question.", intakeSkip),
];

export function matchRoute(method: string, pathname: string): { route: Route; rest: string } {
  const exact = ROUTES.find((x) => !x.prefix && x.method === method && x.path === pathname);
  if (exact) return { route: exact, rest: "" };
  const pre = ROUTES.find((x) => x.prefix && x.method === method && pathname.startsWith(x.path));
  if (pre) return { route: pre, rest: pathname.slice(pre.path.length) };
  const known = ROUTES.some((x) => (x.prefix ? pathname.startsWith(x.path) : x.path === pathname));
  throw new HttpError(known ? 405 : 404, known ? "Method not allowed." : "Not found.");
}
