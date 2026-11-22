export type Schema = Record<string, unknown>;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function fitsObject(v: unknown, s: Schema): boolean {
  if (!isObject(v)) return false;
  const props = (s.properties ?? {}) as Record<string, Schema>;
  const required = (s.required ?? []) as string[];
  if (required.some((k) => !(k in v))) return false;
  if (s.additionalProperties === false && Object.keys(v).some((k) => !(k in props))) return false;
  return Object.entries(v).every(([k, x]) => !(k in props) || fits(x, props[k]));
}

function fitsArray(v: unknown, s: Schema): boolean {
  if (!Array.isArray(v)) return false;
  if (typeof s.maxItems === "number" && v.length > s.maxItems) return false;
  return !s.items || v.every((x) => fits(x, s.items as Schema));
}

function fitsString(v: unknown, s: Schema): boolean {
  if (typeof v !== "string") return false;
  return typeof s.maxLength !== "number" || v.length <= s.maxLength;
}

const MAX_QUOTE = 120;
const flat = (s: string) => s.replace(/\s+/g, " ").trim();

function quoted(source: string, from: string): boolean {
  const quote = flat(from);
  return quote.length > 0 && quote.length <= MAX_QUOTE && flat(source).includes(quote);
}

export interface Kept<T> {
  kept: T[];
  no_quote: number;
  off_list: number;
}

export function keepQuoted<T extends { from: string; into: string }>(source: string, items: readonly T[], paths: ReadonlySet<string>): Kept<T> {
  const out: Kept<T> = { kept: [], no_quote: 0, off_list: 0 };
  for (const item of items) {
    if (!quoted(source, item.from)) out.no_quote++;
    else if (!paths.has(item.into)) out.off_list++;
    else out.kept.push(item);
  }
  return out;
}

export function fits(v: unknown, s: Schema): boolean {
  if (Array.isArray(s.enum)) return s.enum.includes(v);
  switch (s.type) {
    case "object":
      return fitsObject(v, s);
    case "array":
      return fitsArray(v, s);
    case "string":
      return fitsString(v, s);
    case "boolean":
      return typeof v === "boolean";
    case "integer":
      return Number.isInteger(v);
    case "number":
      return typeof v === "number" && Number.isFinite(v);
    default:
      return false;
  }
}
