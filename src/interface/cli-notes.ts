import { readFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { capture, newNote } from "../capture/actions.ts";
import { summary } from "../core/notes.ts";
import { loadAll } from "../core/files.ts";
import { log, readLog } from "../core/log.ts";
import { buildCard, cardLines, isSubject, matchSubject } from "../reports/card.ts";
import { areaBrief, areaMarkdown } from "../reports/reports.ts";
import { backlinks, findNote } from "../reports/find.ts";
import { find, list } from "../core/search.ts";
import { type CliContext, fail, out, printHits, writeReport } from "./cli-shared.ts";

export async function addCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json, report } = c;
  const text = args.join(" ").trim() || (!process.stdin.isTTY ? readFileSync(0, "utf8").trim() : "");
  if (!text) return fail('Say what to save: brain add "text"');
  const { smartAdd } = await import("../capture/file.ts");
  const notes = loadAll(root);
  const result = smartAdd(root, notes, text);
  if (result.filed) {
    const title = summary(notes.find((n) => n.path === result.into)!).title;
    report(result, `${pc.green("Added")} to ${title} as a ${result.as}: ${result.text}  ${pc.dim(result.into)}`);
    return 0;
  }
  const note = capture(root, { text: result.text, tags: flags.tag, area: flags.area });
  if (flags.json) json({ ...summary(note), guess: result.guess });
  else out(`${pc.green("Saved")} to the inbox: ${note.path}${result.guess ? pc.dim(`  (best guess: ${result.guess})`) : ""}`);
  return 0;
}

export async function newCommand(c: CliContext): Promise<number> {
  const { root, args, flags, report } = c;
  const [type, ...title] = args;
  if (!type || !title.length) return fail('Use: brain new <Type> "Title"');
  const extra: Record<string, string> = {};
  if (flags.area) extra.area = flags.area;
  if (flags.description) extra.description = flags.description;
  if (flags.date) extra.date = flags.date;
  if (flags.with) extra.with = flags.with;
  const note = newNote(root, type[0].toUpperCase() + type.slice(1), title.join(" "), extra);
  if (!flags.description) out(pc.dim('Tip: add -d "one line on what it is" so it passes brain check.'));
  report(summary(note), `${pc.green("Created")} ${note.path}`);
  return 0;
}

export async function findCommand(c: CliContext): Promise<number> {
  const { root, args, flags, tag, limit, json } = c;
  const query = args.join(" ");
  const { meaningEmbedder } = await import("../core/embed.ts");
  const filters = { type: flags.type, tag, area: flags.area, status: flags.status, limit, all: flags.all };
  const { notes: hits } = await find(root, query, filters, query.trim() ? await meaningEmbedder(root) : null);
  const notes = loadAll(root);
  const subject = !flags.type && !tag && !flags.area && !flags.status ? matchSubject(notes, query) : undefined;
  const card = subject && buildCard(root, notes, subject);
  if (flags.json) json(card ? { card, hits } : hits);
  else {
    if (card) out(cardLines(card).join("\n") + "\n");
    printHits(card ? hits.filter((h) => h.path !== card.subject.path) : hits);
  }
  return 0;
}

export async function listCommand(c: CliContext): Promise<number> {
  const { root, flags, tag, limit, json } = c;
  const items = list(root, { type: flags.type, tag, area: flags.area, status: flags.status, limit });
  flags.json ? json(items) : printHits(items);
  return 0;
}

export async function showCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json } = c;
  const notes = loadAll(root);
  const note = findNote(notes, args.join(" "));
  if (!note) return fail(`No note matches "${args.join(" ")}".`);
  const links = backlinks(notes, note.path);
  const card = isSubject(note) ? buildCard(root, notes, note) : undefined;
  if (flags.json) json({ ...summary(note), meta: note.meta, body: note.body, backlinks: links, ...(card && { card }) });
  else if (card) {
    out(cardLines(card).join("\n"));
    out(`\n${pc.dim("Full note:")} ${note.path}`);
  } else {
    out(`${pc.bold(summary(note).title)}  ${pc.dim(note.path)}\n`);
    out(readFileSync(join(root, note.path), "utf8").trimEnd());
    out(`\n${pc.bold("Linked from")}`);
    printHits(links);
  }
  return 0;
}

export async function recentCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json } = c;
  const days = Number(args[0] ?? 7);
  const cutoff = Date.now() - days * 86_400_000;
  const items = loadAll(root).filter((n) => n.mtime >= cutoff).sort((a, b) => b.mtime - a.mtime).map(summary);
  flags.json ? json(items) : printHits(items);
  return 0;
}

export async function areaCommand(c: CliContext): Promise<number> {
  const { root, args, flags, json } = c;
  const slug = args[0];
  if (!slug) {
    const areas = list(root, { type: "Area" }).sort((a, b) => a.title.localeCompare(b.title));
    flags.json ? json(areas) : printHits(areas);
    return 0;
  }
  const brief = areaBrief(root, slug);
  const md = areaMarkdown(brief);
  const path = writeReport(root, `area-${slug}`, md);
  flags.json ? json({ ...brief, note: brief.note && summary(brief.note), markdown: md }) : (out(md), out(pc.dim(`Saved to ${path}`)));
  return 0;
}

export async function logCommand(c: CliContext): Promise<number> {
  const { root, args, flags, limit, json } = c;
  const text = args.join(" ").trim();
  if (!text) {
    const entries = readLog(root, limit ?? 20);
    if (flags.json) json(entries);
    else if (!entries.length) out(pc.dim("Nothing logged yet."));
    else for (const entry of entries) out(`${pc.dim(entry.at.replace("T", " ").slice(0, 16))}  ${entry.msg}`);
    return 0;
  }
  log(root, text);
  out(`${pc.green("Logged.")}`);
  return 0;
}
