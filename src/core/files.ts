import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { randomBytes } from "node:crypto";
import { brainHome, dump, extractLinks, type Meta, type Note, NOTE_DIRS, parse } from "./notes.ts";

export function statMtime(root: string, rel: string): number {
  return statSync(join(root, rel)).mtimeMs;
}

export function readNote(root: string, rel: string): Note {
  const full = join(root, rel);
  const { meta, body, error } = parse(readFileSync(full, "utf8"));
  return { path: rel, meta, body, mtime: statSync(full).mtimeMs, links: extractLinks(rel, body), error };
}

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(p);
  }
}

export function notePaths(root = brainHome()): string[] {
  const out: string[] = [];
  for (const d of NOTE_DIRS) {
    const base = join(root, d);
    if (existsSync(base)) walk(base, out);
  }
  return out.map((p) => relative(root, p).split(sep).join("/")).sort();
}

export function loadAll(root = brainHome()): Note[] {
  return notePaths(root).map((rel) => readNote(root, rel));
}

export function writeAtomic(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = join(dirname(path), `.tmp-${randomBytes(6).toString("hex")}`);
  try {
    writeFileSync(tmp, text, "utf8");
    renameSync(tmp, path);
  } catch (err) {
    if (existsSync(tmp)) unlinkSync(tmp);
    throw err;
  }
}

export function writeNote(root: string, rel: string, meta: Meta, body: string): Note {
  writeAtomic(join(root, rel), dump(meta, body));
  return readNote(root, rel);
}

/** Move a note. Writes the new file first, then removes the old one. */
export function moveNote(root: string, from: string, to: string, meta: Meta, body: string): Note {
  const note = writeNote(root, to, meta, body);
  if (from !== to) unlinkSync(join(root, from));
  return note;
}

export function slugify(text: string, max = 60): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.slice(0, max).replace(/-+$/, "") || "note";
}

export function uniquePath(root: string, folder: string, slug: string): string {
  let rel = `${folder}/${slug}.md`;
  for (let suffix = 2; existsSync(join(root, rel)); suffix++) rel = `${folder}/${slug}-${suffix}.md`;
  return rel;
}
