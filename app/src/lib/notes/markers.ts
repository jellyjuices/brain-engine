export interface Edit {
  value: string;
  start: number;
  end: number;
}

const WORD = /[\p{L}\p{N}_]/u;
const GAP = /[ \t]/;

function isWrapped(before: string, after: string, mark: string): boolean {
  if (!before.endsWith(mark) || !after.startsWith(mark)) return false;
  const outBefore = before[before.length - mark.length - 1] ?? "";
  const outAfter = after[mark.length] ?? "";
  if (outBefore === mark[0] || outAfter === mark[0]) return false;
  return mark !== "_" || (!WORD.test(outBefore) && !WORD.test(outAfter));
}

export function wrapMarks(value: string, start: number, end: number, mark: string): Edit {
  const before = value.slice(0, start);
  const inner = value.slice(start, end);
  const after = value.slice(end);
  if (isWrapped(before, after, mark)) {
    const at = start - mark.length;
    return {
      value: before.slice(0, at) + inner + after.slice(mark.length),
      start: at,
      end: at + inner.length,
    };
  }
  return {
    value: before + mark + inner + mark + after,
    start: start + mark.length,
    end: end + mark.length,
  };
}

function lineRange(value: string, start: number, end: number): [number, number] {
  const last = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const from = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  const stop = value.indexOf("\n", last);
  return [from, stop === -1 ? value.length : stop];
}

export function prefixLines(value: string, start: number, end: number, prefix: string): Edit {
  const [from, to] = lineRange(value, start, end);
  const lines = value.slice(from, to).split("\n");
  const filled = lines.filter((l) => l.trim());
  const remove = filled.length > 0 && filled.every((l) => l.startsWith(prefix));
  const next = lines.map((l) => {
    if (!l.trim()) return l;
    if (remove) return l.slice(prefix.length);
    return l.startsWith(prefix) ? l : prefix + l;
  });
  const first = next[0]!.length - lines[0]!.length;
  const total = next.join("\n").length - lines.join("\n").length;
  return {
    value: value.slice(0, from) + next.join("\n") + value.slice(to),
    start: Math.max(from, start + first),
    end: Math.max(from, Math.min(end + total, to + total)),
  };
}

export function pasteText(value: string, start: number, end: number, pasted: string): Edit {
  const clean = pasted.replace(/\r\n?/g, "\n").replace(/ /g, " ");
  const at = start + clean.length;
  return { value: value.slice(0, start) + clean + value.slice(end), start: at, end: at };
}

export function insertTrigger(value: string, start: number, end: number, char: string): Edit {
  const before = value.slice(0, start);
  const pad = before && !/\s$/.test(before) ? " " : "";
  const query = value.slice(start, end);
  const at = before.length + pad.length + char.length + query.length;
  return { value: before + pad + char + query + value.slice(end), start: at, end: at };
}

function escaped(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function pullTags(text: string, tags: string[]): { text: string; tags: string[] } {
  let rest = text;
  const found: string[] = [];
  for (const tag of new Set(tags)) {
    const pattern = new RegExp(`(^|\\s)#${escaped(tag)}(?=\\s|$)`, "g");
    if (!pattern.test(rest)) continue;
    found.push(tag);
    rest = rest.replace(pattern, (_: string, lead: string) => (GAP.test(lead) ? "" : lead));
  }
  return { text: rest.trim(), tags: found };
}
