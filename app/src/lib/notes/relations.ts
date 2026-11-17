import { extractLinks, type StoredNote } from "./model.ts";

const RELATION_HEADINGS = [
  "# People",
  "# Groups",
  "# Projects",
  "# Places",
  "# Things",
  "# Topics",
  "# Related",
];

function sectionLines(body: string, heading: string): string[] {
  const lines = body.split("\n");
  const h = lines.findIndex((l) => l.trim() === heading);
  if (h === -1) return [];
  const out: string[] = [];
  for (let i = h + 1; i < lines.length && !lines[i]!.startsWith("# "); i++) out.push(lines[i]!);
  return out;
}

export interface Relation {
  from: string;
  to: string;
  role?: string;
  heading: string;
  time?: string;
}

export function relationsIn(n: StoredNote): Relation[] {
  const out: Relation[] = [];
  for (const h of RELATION_HEADINGS) {
    for (const line of sectionLines(n.body, h)) {
      const m = line.trim().match(/^- (\[[^\]]*\]\([^)\s]+\))(.*)$/);
      if (!m) continue;
      const [to] = extractLinks(n.path, m[1]!);
      const rest = m[2]!.trim();
      if (!to || (rest && !rest.startsWith("·"))) continue;
      const [role, time] = rest
        .split("·")
        .map((x) => x.trim())
        .filter(Boolean);
      out.push({
        from: n.path,
        to,
        heading: h.slice(2),
        ...(role && { role }),
        ...(time && { time }),
      });
    }
  }
  return out;
}
