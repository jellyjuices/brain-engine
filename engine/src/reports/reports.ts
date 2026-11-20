// Reports and checks built from the notes: today, weekly, area briefs, the index, check, show.

import { existsSync } from "node:fs";
import { join, posix } from "node:path";
import { addDays, areasOf, descOf, DIRS, folderOf, type Note, str, summary, type Summary, tagsOf, titleOf, today, typeOf } from "../core/notes.ts";
import { loadAll, writeAtomic } from "../core/files.ts";
import type { Issue } from "../core/schema.ts";
import { allLoops, inArea as loopInArea, loopSummary, whenWord } from "../todos/todos.ts";
import { allIssues } from "./check-issues.ts";
import { isOwnerWriter } from "../core/owner.ts";

/** Inbox notes not yet sorted (no outcome). Sorted captures wait in the inbox only until they are absorbed. */
export const untriaged = (notes: Note[]) => notes.filter((n) => folderOf(n) === "inbox" && !n.meta.outcome);

const DAY = 86_400_000;
const live = (n: Note) => folderOf(n) !== DIRS.archive && str(n.meta.status) !== "deprecated";
const ageDays = (n: Note, now: string) => Math.floor((Date.parse(`${now}T23:59:59`) - n.mtime) / DAY);
const link = (s: Summary, from: string = DIRS.reports) => `[${s.title}](${posix.relative(from, s.path)})`;

function section(title: string, items: string[], empty = "Nothing here.") {
  return `## ${title}\n\n${items.length ? items.join("\n") : empty}\n`;
}

export interface TodayReport {
  date: string;
  overdue: Summary[];
  dueSoon: Summary[];
  activeProjects: Summary[];
  inboxCount: number;
}

export function todayReport(root: string, notes = loadAll(root)): TodayReport {
  const now = today();
  const soon = addDays(now, 7);
  const open = notes.filter(live);
  // Things to act on: whole notes with a due date or outcome, plus open loop lines inside notes.
  const whole = open.filter((n) => str(n.meta.outcome) !== "drop").map(summary);
  // Loops inside a listed event fold into it as bullets, so one visit is one item.
  const events = new Map(whole.filter((s) => s.type === "Event" && s.due).map((s) => [s.path, s]));
  const loose: Summary[] = [];
  for (const todo of allLoops(notes, { done: false })) {
    const ev = events.get(todo.path);
    if (ev) (ev.subitems ??= []).push(todo.text);
    else loose.push(loopSummary(todo));
  }
  const items = [...whole, ...loose];
  const withDue = items.filter((s) => s.due);
  const byDue = (a: Summary, b: Summary) => (a.due ?? "").localeCompare(b.due ?? "");
  return {
    date: now,
    overdue: withDue.filter((s) => s.due! < now).sort(byDue),
    dueSoon: withDue.filter((s) => s.due! >= now && s.due! <= soon).sort(byDue),
    activeProjects: open.filter((n) => typeOf(n) === "Project" && folderOf(n) === "projects").map(summary).sort((a, b) => a.title.localeCompare(b.title)),
    inboxCount: untriaged(notes).length,
  };
}

export function todayMarkdown(r: TodayReport): string {
  const bullets = (s: Summary) => (s.subitems ?? []).map((t) => `\n  - ${t}`).join("");
  const dated = (s: Summary) => `- ${s.due} · ${link(s)}${s.description ? ` · ${s.description}` : ""}${bullets(s)}`;
  return [
    `# Today, ${r.date}\n`,
    `Inbox: ${r.inboxCount} note${r.inboxCount === 1 ? "" : "s"} to sort.\n`,
    section("Overdue", r.overdue.map(dated)),
    section("Today", r.dueSoon.filter((s) => s.due === r.date).map((s) => `- ${link(s)}${s.area ? ` · ${s.area}` : ""}${bullets(s)}`)),
    section("Due in the next 7 days", r.dueSoon.filter((s) => s.due !== r.date).map(dated)),
    section("Active projects", r.activeProjects.map((s) => `- ${link(s)}${s.description ? ` · ${s.description}` : ""}`), "No projects yet."),
  ].join("\n");
}

export interface WeeklyReport {
  date: string;
  stale: Summary[];
  quietProjects: (Summary & { days: number })[];
  unverified: Summary[];
  parked: Summary[];
  inboxCount: number;
}

export function weeklyReport(root: string, notes = loadAll(root)): WeeklyReport {
  const now = today();
  const open = notes.filter(live);
  const filed = open.filter((n) => folderOf(n) !== "inbox");
  return {
    date: now,
    stale: open.filter((n) => str(n.meta.stale_after) && String(n.meta.stale_after) < now).map(summary),
    quietProjects: open
      .filter((n) => typeOf(n) === "Project" && ageDays(n, now) >= 14)
      .map((n) => ({ ...summary(n), days: ageDays(n, now) }))
      .sort((a, b) => b.days - a.days),
    unverified: filed.filter((n) => n.meta.generated && !isOwnerWriter((n.meta.generated as Record<string, unknown>).by) && !n.meta.verified).map(summary),
    parked: [...open.filter((n) => n.meta.outcome === "someday").map(summary), ...allLoops(notes, { done: false }).filter((l) => l.outcome === "someday").map(loopSummary)],
    inboxCount: untriaged(notes).length,
  };
}

export function weeklyMarkdown(r: WeeklyReport): string {
  return [
    `# Weekly review, ${r.date}\n`,
    `Inbox: ${r.inboxCount} note${r.inboxCount === 1 ? "" : "s"} to sort.\n`,
    section("Past their check date", r.stale.map((s) => `- ${link(s)} · check again`)),
    section("Projects with no change in 14 days", r.quietProjects.map((s) => `- ${link(s)} · ${s.days} days`)),
    section("Written by a helper, not checked by the owner", r.unverified.map((s) => `- ${link(s)}`)),
    section("Someday", r.parked.map((s) => `- ${link(s)}`)),
  ].join("\n");
}

export interface AreaBrief {
  area: string;
  note?: Note & { title: string };
  projects: Summary[];
  open: Summary[];
  recent: Summary[];
  related: Summary[];
}

export function areaBrief(root: string, area: string, notes = loadAll(root)): AreaBrief {
  const now = today();
  const self = notes.find((n) => n.path === `areas/${area}.md`);
  const inArea = notes.filter((n) => n !== self && live(n) && (areasOf(n).includes(area) || tagsOf(n).includes(area)));
  return {
    area,
    note: self ? { ...self, title: titleOf(self) } : undefined,
    projects: inArea.filter((n) => typeOf(n) === "Project").map(summary),
    open: [
      ...inArea.filter((n) => ["today", "date", "waiting"].includes(String(n.meta.outcome)) || summary(n).due).map(summary),
      ...allLoops(self ? [self, ...inArea] : inArea, { done: false }).filter((l) => loopInArea(l, area) || l.path === self?.path).map(loopSummary),
    ],
    recent: inArea.filter((n) => ageDays(n, now) <= 14).map(summary).sort((a, b) => b.modified.localeCompare(a.modified)),
    related: inArea.map(summary),
  };
}

export function areaMarkdown(b: AreaBrief): string {
  const title = b.note?.title ?? b.area;
  const line = (s: Summary) => `- ${link(s)}${s.outcome ? ` · ${whenWord(s.outcome)}` : ""}${s.due ? ` · due ${s.due}` : ""}`;
  return [
    `# ${title}\n`,
    b.note ? `${descOf(b.note)}\n\nSource: [${b.note.path}](../${b.note.path})\n` : `No note at areas/${b.area}.md yet.\n`,
    section("Projects", b.projects.map(line)),
    section("Open items", b.open.map(line)),
    section("Changed in the last 14 days", b.recent.map((s) => `- ${s.modified} · ${link(s)}`)),
    section(`All notes in this area (${b.related.length})`, b.related.map((s) => `- ${link(s)}`)),
  ].join("\n");
}

const ORDER = ["areas", "projects", "events", "people", "groups", "places", "things", "topics", "resources", "me", "threads", "journal", "inbox", DIRS.archive];

export function indexMarkdown(notes: Note[]): string {
  const out = [`# Index\n`, `A map of every note. Rebuilt by \`brain index\`. Do not edit by hand.\n`];
  for (const folder of ORDER) {
    const group = notes.filter((n) => folderOf(n) === folder).map(summary).sort((a, b) => a.title.localeCompare(b.title));
    if (!group.length) continue;
    out.push(`## ${folder} (${group.length})\n`);
    out.push(group.map((s) => `- [${s.title}](${posix.relative(DIRS.reports, s.path)})${s.description ? ` · ${s.description}` : ""}`).join("\n") + "\n");
  }
  return out.join("\n");
}

export function writeIndexMd(root: string, notes = loadAll(root)) {
  writeAtomic(join(root, DIRS.reports, "index.md"), indexMarkdown(notes));
}

export interface CheckResult {
  path: string;
  issues: Issue[];
}

export function check(root: string, notes = loadAll(root)): CheckResult[] {
  const results = new Map<string, Issue[]>();
  for (const [p, i] of allIssues(root, notes)) results.set(p, [...(results.get(p) ?? []), i]);
  return [...results.entries()].map(([path, issues]) => ({ path, issues })).sort((a, b) => a.path.localeCompare(b.path));
}
