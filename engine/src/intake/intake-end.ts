import { namesOf, subjectsNamed } from "../capture/file.ts";
import { type Note, typeOf } from "../core/notes.ts";
import { fresh, LINKABLE, readSession, rel, writeSession } from "./subjects.ts";

const LINK = /\[[^\]]*\]\([^)]*\)/g;

/** Link the first mention of each known subject in the text. Already-linked names are left alone. */
export function linkKnownNames(notes: Note[], text: string, fromPath: string): string {
  let out = text;
  for (const note of subjectsNamed(notes, text).filter((n) => LINKABLE.includes(typeOf(n) ?? ""))) {
    const target = rel(fromPath, note.path);
    if (out.includes(`(${target})`)) continue;
    for (const name of namesOf(note).sort((a, b) => b.length - a.length)) {
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\p{L}\\p{N}])`, "iu");
      const parts = out.split(new RegExp(`(${LINK.source})`));
      const at = parts.findIndex((p, i) => i % 2 === 0 && re.test(p));
      if (at === -1) continue;
      parts[at] = parts[at].replace(re, (_m, pre: string, hit: string) => `${pre}[${hit}](${target})`);
      out = parts.join("");
      break;
    }
  }
  return out;
}


export interface EndSummary {
  new: { name: string; type: string; path: string }[];
  lines: string[];
  todos: number;
  text: string[];
}

/** What this session built, in plain lines, with how to fix or undo it. Clears the session. */
export function endSummary(root: string, opts: { keep?: boolean } = {}): EndSummary {
  const session = readSession(root);
  const news = session.changes.filter((c) => c.kind === "new").map((c) => ({ name: c.subject, type: c.type ?? "", path: c.path }));
  const lines = session.changes.filter((c) => c.kind === "relation").map((c) => c.text);
  const facts = session.changes.filter((c) => c.kind === "fact").length;
  const todos = session.changes.filter((c) => c.kind === "todo").length;
  const text: string[] = [];
  if (news.length) text.push(`New: ${news.map((n) => `${n.name} (${n.type})`).join(", ")}${lines.length ? ", " + lines.join(" ") : "."}`);
  else if (lines.length) text.push(lines.join(" "));
  if (facts) text.push(`${facts} fact${facts === 1 ? "" : "s"} added to subject notes.`);
  if (todos) text.push(`${todos} to-do${todos === 1 ? "" : "s"} filed in subject notes. None in the inbox.`);
  if (text.length) text.push("To fix one, edit its note or tell me. To put back the last change, use undo. To remove a new note, move it to .archive/.");
  else text.push("No new subjects, facts or to-dos this session.");
  if (!opts.keep) writeSession(root, fresh());
  return { new: news, lines, todos, text };
}
