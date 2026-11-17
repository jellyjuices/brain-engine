export interface Edit {
  value: string;
  start: number;
  end: number;
}

export function wrapMarks(value: string, start: number, end: number, mark: string): Edit {
  const before = value.slice(0, start);
  const inner = value.slice(start, end);
  const after = value.slice(end);
  if (before.endsWith(mark) && after.startsWith(mark)) {
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

export function prefixLines(value: string, start: number, end: number, prefix: string): Edit {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const lines = value.slice(from, end).split("\n");
  const remove = lines.every((l) => l.startsWith(prefix));
  const next = lines.map((l) =>
    remove ? l.slice(prefix.length) : l.startsWith(prefix) ? l : prefix + l,
  );
  const first = next[0]!.length - lines[0]!.length;
  const total = next.join("\n").length - lines.join("\n").length;
  return {
    value: value.slice(0, from) + next.join("\n") + value.slice(end),
    start: Math.max(from, start + first),
    end: Math.max(from, end + total),
  };
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
    rest = rest.replace(pattern, "$1");
  }
  return { text: rest.replace(/[ \t]{2,}/g, " ").trim(), tags: found };
}
