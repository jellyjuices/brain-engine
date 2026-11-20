import { DIRS, folderOf, SLUG, tagsOf, type Note } from "./notes.ts";
import { statusesFor } from "./schema-kinds.ts";
import type { Issue, Schema } from "./schema.ts";

interface CheckInput {
  note: Note;
  meta: Note["meta"];
  schema: Schema;
  type: string | undefined;
}

type Check = (c: CheckInput) => Issue[];

const error = (message: string): Issue => ({ level: "error", message });
const warn = (message: string): Issue => ({ level: "warn", message });
const isDate = (v: unknown) => /^\d{4}-\d{2}-\d{2}/.test(String(v)) && !isNaN(Date.parse(String(v).slice(0, 10)));
const notIn = (value: unknown, allowed: string[]) => Boolean(value) && !allowed.includes(String(value));

function typeCheck({ schema, type }: CheckInput): Issue[] {
  if (!type) return [error("missing `type`")];
  return type in schema.types ? [] : [error(`unknown type \`${type}\` (see .schema/types.yaml)`)];
}

const tagCheck: Check = ({ note, schema }) => tagsOf(note).filter((t) => !schema.tags.has(t)).map((t) => error(`unknown tag \`${t}\` (add it to .schema/tags.yaml)`));

function placeIssue(type: string | undefined, folder: string, schema: Schema): Issue[] {
  const expected = type ? schema.types[type] : undefined;
  if (!expected || expected === "inbox" || expected === folder) return [];
  return [warn(`type \`${type}\` belongs in ${expected}/, not ${folder}/`)];
}

function filedCheck({ note, meta, schema, type }: CheckInput): Issue[] {
  const folder = folderOf(note);
  if (folder === "inbox" || folder === DIRS.archive) return [];
  const missing = schema.filedRequired.filter((f) => !meta[f]).map((f) => error(`filed note is missing \`${f}\``));
  return [...missing, ...placeIssue(type, folder, schema)];
}

function descriptionCheck({ meta, schema }: CheckInput): Issue[] {
  const long = Boolean(meta.description) && String(meta.description).length > schema.descriptionMax;
  return long ? [warn(`description is over ${schema.descriptionMax} characters`)] : [];
}

const statusCheck: Check = ({ meta, schema, type }) => (notIn(meta.status, statusesFor(type, schema)) ? [error(`unknown status \`${meta.status}\``)] : []);

const privacyValueCheck: Check = ({ meta, schema }) => (notIn(meta.privacy, schema.privacy) ? [error(`unknown privacy \`${meta.privacy}\` (use ${schema.privacy.join(", ")})`)] : []);

function lensCheck({ meta, schema, type }: CheckInput): Issue[] {
  if ((type !== "Thread" && type !== "Lens") || !schema.lenses.length) return [];
  if (!meta.lens) return [error("missing `lens`")];
  return notIn(meta.lens, schema.lenses) ? [error(`unknown lens \`${meta.lens}\` (see .schema/types.yaml)`)] : [];
}

function depthCheck({ meta, type }: CheckInput): Issue[] {
  const bad = type === "Thread" && meta.depth !== undefined && !Number.isInteger(Number(meta.depth));
  return bad ? [error("`depth` must be a whole number")] : [];
}

const privacyDetailCheck: Check = ({ note, type }) => privacyIssues(note, type).map(warn);

function outcomeCheck({ meta, schema }: CheckInput): Issue[] {
  const bad = schema.outcome.length > 0 && notIn(meta.outcome, schema.outcome);
  return bad ? [error(`unknown outcome \`${meta.outcome}\``)] : [];
}

function eventCheck({ meta, type }: CheckInput): Issue[] {
  if (type !== "Event") return [];
  const out: Issue[] = [];
  if (!meta.date) out.push(error("missing `date` (use YYYY-MM-DD)"));
  if (meta.due) out.push(warn("an Event uses `date`, not `due`"));
  return out;
}

const dateCheck: Check = ({ meta }) =>
  ["due", "stale_after", "date"].filter((f) => meta[f] && !isDate(meta[f])).map((f) => error(`\`${f}\` is not a date (use YYYY-MM-DD)`));

function areaCheck({ meta }: CheckInput): Issue[] {
  const bad = Boolean(meta.area) && meta.areas === undefined && !SLUG.test(String(meta.area));
  return bad ? [warn("`area` should be the slug of a note in areas/")] : [];
}

export const CHECKS: Check[] = [typeCheck, tagCheck, filedCheck, descriptionCheck, statusCheck, privacyValueCheck, lensCheck, depthCheck, privacyDetailCheck, outcomeCheck, eventCheck, dateCheck, areaCheck];

const answerLines = (log: string) => log.split("\n").filter((l) => l.startsWith("- "));
const plainLen = (l: string) => l.replace(/\s*\(\[raw\]\([^)]*\)\)/g, "").length;
const answers = (n: number) => `${n} answer${n === 1 ? " is" : "s are"}`;

function lensPrivacyIssues(body: string, privacy: string | undefined): string[] {
  const log = body.split(/^# Intake log\s*$/m)[1] ?? "";
  const out: string[] = [];
  if (privacy === "skip" && /^## \d{4}-/m.test(log)) out.push("this lens is set to skip, but it has intake answers");
  if (privacy === "headline") {
    const long = answerLines(log).filter((l) => l.length > 162).length;
    if (long) out.push(`this lens is set to headline, but ${answers(long)} long. Keep one short line each.`);
    return out;
  }
  const long = answerLines(log).filter((l) => plainLen(l) > 242).length;
  if (long) out.push(`${answers(long)} long. Distill to one line and keep the full answer with --raw.`);
  return out;
}

function privacyIssues(n: Note, type: string | undefined): string[] {
  const privacy = n.meta.privacy ? String(n.meta.privacy) : undefined;
  if (type === "Lens") return lensPrivacyIssues(n.body, privacy);
  return type === "Thread" && privacy === "skip" ? ["this thread has privacy skip. Close it or change the lens setting."] : [];
}
