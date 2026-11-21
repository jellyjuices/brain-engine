import type { StoredNote } from "./model.ts";

export interface GoalDraft {
  title: string;
  why: string;
  targets: string;
  areas: string[];
}

export interface AreaChoice {
  slug: string;
  title: string;
}

export interface GoalRequest {
  type: "Goal";
  title: string;
  areas: string[];
  fields?: { why: string };
  sections?: { "# Targets": string[] };
}

export function areaChoices(notes: StoredNote[]): AreaChoice[] {
  return notes
    .filter((n) => n.type === "Area" && /^areas\/[^/]+\.md$/.test(n.path))
    .map((n) => ({ slug: n.path.slice("areas/".length, -".md".length), title: n.title }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function targetLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]\s*)?(?:\[[ xX]\]\s*)?/, "").trim())
    .filter(Boolean)
    .map((line) => `- [ ] ${line}`);
}

export function pickedTitles(choices: AreaChoice[], picked: Set<string>): string[] {
  return choices.filter((c) => picked.has(c.slug)).map((c) => c.title);
}

export function goalRequest(draft: GoalDraft): GoalRequest {
  const why = draft.why.replace(/\s+/g, " ").trim();
  const targets = targetLines(draft.targets);
  return {
    type: "Goal",
    title: draft.title.replace(/\s+/g, " ").trim(),
    areas: draft.areas,
    ...(why && { fields: { why } }),
    ...(targets.length > 0 && { sections: { "# Targets": targets } }),
  };
}
