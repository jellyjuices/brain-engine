import { str, type Meta } from "../../src/core/notes.ts";
import { AREAS_REQUIRED } from "../../src/core/schema-kinds.ts";

const OLD_CAPTURE_OUTCOMES: Record<string, string> = {
  "do-now": "today",
  schedule: "date",
  park: "someday",
  parked: "someday",
  "hand-off": "waiting",
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const one = str(value);
  return one ? [one] : [];
}

function withAreas(meta: Meta): Meta {
  const areas = [...new Set([...asList(meta.areas), ...asList(meta.area)])];
  const out: Meta = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key === "areas") out.areas = areas;
    else if (key !== "area") out[key] = value;
    else if (!("areas" in meta) && areas.length) out.areas = areas;
  }
  return out;
}

export interface MetaChange {
  kind: "area" | "outcome";
  what: string;
}

export function migrateMeta(meta: Meta): { meta: Meta; changes: MetaChange[] } {
  const changes: MetaChange[] = [];
  let out = meta;
  if ("area" in meta) {
    out = withAreas(meta);
    changes.push({ kind: "area", what: `area: ${str(meta.area) ?? "(empty)"} → areas: [${asList(out.areas).join(", ")}]` });
  }
  const outcome = str(out.outcome);
  if (outcome && Object.hasOwn(OLD_CAPTURE_OUTCOMES, outcome)) {
    out = { ...out, outcome: OLD_CAPTURE_OUTCOMES[outcome] };
    changes.push({ kind: "outcome", what: `outcome: ${outcome} → ${OLD_CAPTURE_OUTCOMES[outcome]}` });
  }
  return { meta: out, changes };
}

export function needsAreas(meta: Meta): boolean {
  const type = str(meta.type);
  return !!type && AREAS_REQUIRED.includes(type) && asList(meta.areas).length === 0 && asList(meta.area).length === 0;
}
