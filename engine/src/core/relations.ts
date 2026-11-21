import { extractLinks, type Note } from "./notes.ts";
import { sectionRange } from "../../shared/line/index.ts";

const RELATION_HEADINGS = ["# People", "# Groups", "# Projects", "# Places", "# Things", "# Topics", "# Goals", "# Decisions", "# Related"];

const HEADING_OF_TYPE: Record<string, string> = { Person: "# People", Group: "# Groups", Project: "# Projects", Place: "# Places", Thing: "# Things", Topic: "# Topics", Goal: "# Goals", Decision: "# Decisions" };

export const headingForType = (type: string | undefined): string => HEADING_OF_TYPE[type ?? ""] ?? "# Related";

export interface Relation {
  from: string;
  to: string;
  role?: string;
  heading: string;
  time?: string;
}

const LINE = /^- (\[[^\]]*\]\([^)\s]+\))(.*)$/;

export function parseRelationLine(from: string, heading: string, line: string): Relation | null {
  const match = line.trim().match(LINE);
  if (!match) return null;
  const [to] = extractLinks(from, match[1]);
  if (!to) return null;
  const rest = match[2].trim();
  if (rest && !rest.startsWith("·")) return null;
  const [role, time] = rest.split("·").map((x) => x.trim()).filter(Boolean);
  return { from, to, heading: heading.slice(2), ...(role && { role }), ...(time && { time }) };
}

export function relationsIn(n: Note): Relation[] {
  const lines = n.body.split("\n");
  const out: Relation[] = [];
  for (const heading of RELATION_HEADINGS) {
    const range = sectionRange(lines, heading);
    if (!range) continue;
    for (let i = range[0]; i < range[1]; i++) {
      const rel = parseRelationLine(n.path, heading, lines[i]);
      if (rel) out.push(rel);
    }
  }
  return out;
}
