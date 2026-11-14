// Every `brain serve` route in one table. The MCP layer reads it: one tool per route, named by `tool`.
// A tool's description is `summary` then `use`, so keep the two together under 30 words.
// DECISION: a to-do ref is the stable `path::text` string (an event's ref is its note path). List numbers are only for the terminal.

import { calendarFeed } from "../../todos/calendar.ts";
import { HttpError } from "../server-auth.ts";
import { type Ctx, TextBody } from "../server-context.ts";
import { addFile, addJournal, addPerson, addSubject, doneRoute, dropRoute, editNote, inboxDrop, moveRoute, setBirthday, undoRoute } from "../server-writes.ts";
import { cardRoute, intakeNext, intakeSave, intakeSkip, listRoute, notesSince, oneNote, report, searchRoute, todayRoute } from "../server-reads.ts";
import { newAgentToken, revokeAgent } from "./agent.ts";
import { addRoute, sortRoute, unsortedRoute } from "./capture.ts";
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
  /** When an agent should call it. Owner-only routes have none: they are never tools. */
  use?: string;
  handler: Handler;
  /** Only the owner may call it, never an agent token. */
  owner?: boolean;
}

const r = (method: Method, path: string, tool: string, summary: string, use: string, handler: Handler, extra: Partial<Route> = {}): Route => ({ method, path, tool, summary, ...(use && { use }), handler, ...extra });

export const ROUTES: Route[] = [
  r("POST", "/api/add", "add", "Add a thought. With a tag, person or subject it is filed at once; else it waits in the inbox.", "Use for any new thought or to-do.", addRoute),
  r("POST", "/api/done", "done", "Tick a to-do, with an optional note and follow-up.", "Use when a to-do is finished.", doneRoute),
  r("POST", "/api/move", "move", "Give a to-do a new When.", "Use to put a to-do off, or on hold.", moveRoute),
  r("POST", "/api/drop", "delete_todo", "Delete a to-do. It stays on the timeline as dropped.", "Use when a to-do no longer matters.", dropRoute),
  r("POST", "/api/undo", "undo", "Undo the last change. A whole sort is one change.", "Use right after a wrong write.", undoRoute),
  r("GET", "/api/find", "find", "Find notes by words, with the subject card when the words name one.", "Use first to look anything up.", findRoute),
  r("GET", "/api/todos", "todos", "One to-do view: today, soon, no-date, on-hold, by-goal or all.", "Use to get to-do refs.", todosRoute),
  r("GET", "/api/today", "today", "Today: overdue and due to-dos and events.", "Use to plan the day.", todayRoute),
  r("GET", "/api/notes/", "read_note", "Read one note with its backlinks and card.", "Use after find, with the note path.", oneNote, { prefix: true }),
  r("POST", "/api/sort", "sort", "Sort a capture into one or more subjects. The capture is deleted.", "Use on a capture from unsorted.", sortRoute),
  r("GET", "/api/unsorted", "unsorted", "How many captures wait, and which.", "Use before you sort.", unsortedRoute),
  r("POST", "/api/notes", "make_note", "Make a note from a type and a title.", "Use for a new goal, decision or project.", makeNote),
  r("DELETE", "/api/notes/", "delete_note", "Delete a note. It moves to the archive.", "Use only when asked.", deleteNote, { prefix: true }),
  r("PUT", "/api/notes/", "edit_note", "Save an edited note body. Needs the hash it was read at.", "Read the note first.", editNote, { prefix: true }),
  r("GET", "/api/relations", "relations", "The relations of one note, both ways.", "Use to see who or what a note links to.", relationsRoute),
  r("POST", "/api/relations", "add_relation", "Link two notes, with an optional role and time.", "Use when the owner names a tie between two notes.", addRelation),
  r("GET", "/api/log", "log", "The last changes, newest first, and which can be undone.", "Use before undo.", logRoute),
  r("GET", "/api/drafts", "drafts", "Saved adds, sorts and builders that were cut off.", "Use to pick a flow back up.", listDrafts),
  r("POST", "/api/drafts", "save_draft", "Save a step of an add, sort or builder so it can resume.", "Use during a long flow.", saveDraft),
  r("GET", "/api/drafts/", "read_draft", "One saved draft.", "Use with an id from drafts.", oneDraft, { prefix: true }),
  r("DELETE", "/api/drafts/", "delete_draft", "Delete a saved draft.", "Use once a draft is not needed.", dropDraft, { prefix: true }),
  r("POST", "/api/agent-token", "agent_token", "Make a new agent token. Owner only.", "", newAgentToken, { owner: true }),
  r("DELETE", "/api/agent-token", "revoke_agent_token", "Revoke the agent token. Owner only.", "", revokeAgent, { owner: true }),
  r("GET", "/api/notes", "notes_since", "Notes changed since a time, for the app's copy.", "Prefer find.", notesSince),
  r("GET", "/api/search", "search", "Search hits only.", "Use to filter by type, tag, area or status.", searchRoute),
  r("GET", "/api/card", "card", "The subject card for some words.", "Use for all about one person or subject.", cardRoute),
  r("GET", "/api/list", "list", "List notes by type, tag, area or status.", "Use to browse.", listRoute),
  r("GET", "/api/cal.ics", "calendar", "The calendar feed.", "Use for dated items as iCalendar text.", (c) => new TextBody(calendarFeed(c.root), "text/calendar; charset=utf-8")),
  r("GET", "/api/reports/", "report", "A report: today, weekly or area/<slug>.", "Use for a Markdown summary.", report, { prefix: true }),
  r("POST", "/api/inbox", "inbox", "The app's add. Same as /api/add.", "Prefer add.", addRoute),
  r("POST", "/api/people", "add_person", "Make a Person note.", "Use when someone new comes up.", addPerson),
  r("POST", "/api/journal", "add_journal", "Make a journal note for a day.", "Use for a dated journal entry.", addJournal),
  r("POST", "/api/subjects", "add_subject", "Make a Place or Thing note.", "Use for a new place or thing.", addSubject),
  r("POST", "/api/inbox-drop", "drop_capture", "Take a capture out of the inbox into the archive.", "Use for a capture not worth keeping.", inboxDrop),
  r("POST", "/api/files", "add_file", "A text file becomes a note.", "Use to keep pasted text whole.", addFile),
  r("POST", "/api/birthday", "set_birthday", "Set a person's birthday.", "Use with the Person note path.", setBirthday),
  r("GET", "/api/intake/next", "intake_next", "Open intake questions.", "Use to start an intake.", intakeNext),
  r("POST", "/api/intake/save", "intake_save", "Save an intake answer.", "Use after the owner answers.", intakeSave),
  r("POST", "/api/intake/skip", "intake_skip", "Park an intake question.", "Use when the owner passes.", intakeSkip),
];

export function matchRoute(method: string, pathname: string): { route: Route; rest: string } {
  const exact = ROUTES.find((x) => !x.prefix && x.method === method && x.path === pathname);
  if (exact) return { route: exact, rest: "" };
  const pre = ROUTES.find((x) => x.prefix && x.method === method && pathname.startsWith(x.path));
  if (pre) return { route: pre, rest: pathname.slice(pre.path.length) };
  const known = ROUTES.some((x) => (x.prefix ? pathname.startsWith(x.path) : x.path === pathname));
  throw new HttpError(known ? 405 : 404, known ? "Method not allowed." : "Not found.");
}
