import { isArchived, type StoredNote } from "./model.ts";

export interface LocalHit {
  path: string;
  title: string;
  type?: string;
  description: string;
  snippet: string;
  score: number;
}

function words(q: string) {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function plainText(t: string) {
  return t.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ");
}

function snippetOf(body: string, terms: string[]): string {
  const flat = plainText(body);
  const lower = flat.toLowerCase();
  const i = Math.min(...terms.map((t) => lower.indexOf(t)).filter((x) => x >= 0));
  if (!Number.isFinite(i)) return "";
  const start = Math.max(0, i - 40);
  return `${start > 0 ? "… " : ""}${flat.slice(start, i + 90).trim()}${i + 90 < flat.length ? " …" : ""}`;
}

function scoreNote(n: StoredNote, q: string, terms: string[]): number {
  const title = n.title.toLowerCase();
  const desc = n.description.toLowerCase();
  const tags = n.tags.join(" ").toLowerCase();
  const body = n.body.toLowerCase();
  let score = 0;
  if (title === q.toLowerCase().trim()) score += 100;
  else if (title.startsWith(q.toLowerCase().trim())) score += 60;
  for (const t of terms) {
    let s = 0;
    if (title.includes(t)) s += 30;
    if (tags.includes(t)) s += 10;
    if (desc.includes(t)) s += 12;
    const inBody = body.split(t).length - 1;
    if (inBody) s += Math.min(inBody, 5) * 2;
    if (!s) return 0;
    score += s;
  }
  return score;
}

export function searchLocal(notes: StoredNote[], q: string, limit = 30): LocalHit[] {
  const terms = words(q);
  if (!terms.length) return [];
  const hits: (LocalHit & { archived: boolean })[] = [];
  for (const n of notes) {
    const score = scoreNote(n, q, terms);
    if (score > 0)
      hits.push({
        path: n.path,
        title: n.title,
        ...(n.type && { type: n.type }),
        description: n.description,
        snippet: snippetOf(n.body, terms),
        score,
        archived: isArchived(n),
      });
  }
  return hits
    .sort(
      (a, b) =>
        Number(a.archived) - Number(b.archived) ||
        b.score - a.score ||
        a.title.localeCompare(b.title),
    )
    .slice(0, limit)
    .map(({ archived: _a, ...h }) => h);
}
