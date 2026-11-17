// A new area gets the next unused colour from the area palette in .schema/types.yaml.

import { loadAll } from "./files.ts";
import { slugOf, str, typeOf } from "./notes.ts";
import { loadSchema } from "./schema.ts";

export function nextAreaColor(root: string): string | undefined {
  const palette = loadSchema(root).areaColors;
  if (!palette.length) return undefined;
  const used = loadAll(root).filter((n) => typeOf(n) === "Area").map((n) => str(n.meta.color) ?? slugOf(n));
  const counts = palette.map((color) => used.filter((u) => u === color).length);
  return palette[counts.indexOf(Math.min(...counts))];
}
