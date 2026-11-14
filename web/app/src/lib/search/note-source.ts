import type { StoredNote } from "@/lib/notes/model.ts";

const HEAD_KEYS = ["title", "description", "date"] as const;

function quoted(value: string): string {
  return `"${value.replace(/\s+/g, " ")}"`;
}

function headLines(meta: Record<string, unknown>): string[] {
  const scalars = HEAD_KEYS.flatMap((key) => {
    const value = meta[key];
    return typeof value === "string" && value ? [`${key}: ${quoted(value)}`] : [];
  });
  const aliases = Array.isArray(meta.aliases)
    ? meta.aliases.filter((alias): alias is string => typeof alias === "string" && alias !== "")
    : [];
  const aliasLines = aliases.length
    ? ["aliases:", ...aliases.map((alias) => `  - ${quoted(alias)}`)]
    : [];
  return [...scalars, ...aliasLines];
}

export function noteSource(note: StoredNote): string {
  return ["---", ...headLines(note.meta), "---", note.body].join("\n");
}
