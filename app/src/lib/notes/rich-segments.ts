import { BULLET, picker, type Mark, type Picked, type Segment } from "./live-marks.ts";
import { BOLD, ITALIC, type Rich } from "./rich-text.ts";

function extraMarks(text: string, picked: Picked, lists: boolean): Mark[][] {
  const marks: Mark[][] = Array.from({ length: text.length }, () => []);
  const chips = picker(picked);
  if (chips) {
    const all = new RegExp(chips.source, "gu");
    for (const hit of text.matchAll(all))
      for (let i = hit.index; i < hit.index + hit[0].length; i++) marks[i]!.push("mention");
  }
  if (!lists) return marks;
  let at = 0;
  for (const line of text.split("\n")) {
    const bullet = BULLET.exec(line);
    if (bullet) {
      const from = at + bullet[1]!.length;
      for (let i = from; i < from + bullet[2]!.length; i++) marks[i] = ["bullet"];
    }
    at += line.length + 1;
  }
  return marks;
}

export function richSegments(rich: Rich, picked: Picked, lists = true): Segment[] {
  const extra = extraMarks(rich.text, picked, lists);
  const out: Segment[] = [];
  for (let i = 0; i < rich.text.length; i++) {
    const ch = rich.text[i]!;
    const style = ch === "\n" ? 0 : (rich.styles[i] ?? 0);
    const bullet = extra[i]!.includes("bullet");
    const marks: Mark[] = bullet
      ? ["bullet"]
      : [
          ...(style & BOLD ? (["bold"] as const) : []),
          ...(style & ITALIC ? (["italic"] as const) : []),
          ...extra[i]!,
        ];
    const last = out[out.length - 1];
    if (last && last.marks.join() === marks.join()) last.text += ch;
    else out.push({ text: ch, marks });
  }
  return out;
}
