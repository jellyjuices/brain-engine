import { BULLET } from "./live-marks.ts";
import { BOLD, ITALIC, type Rich } from "./rich-text.ts";

export interface FormatState {
  bold: boolean;
  italic: boolean;
  list: boolean;
}

export const NO_FORMATS: FormatState = { bold: false, italic: false, list: false };

export interface NextTyping {
  at: number;
  style: number;
}

function styleAt(rich: Rich, typing: NextTyping | null, start: number, end: number) {
  if (start !== end) {
    const range = rich.styles.slice(start, end);
    return range.length === end - start ? range.reduce((all, s) => all & s, BOLD | ITALIC) : 0;
  }
  if (typing?.at === start) return typing.style;
  return rich.styles[start > 0 ? start - 1 : 0] ?? 0;
}

export function formatState(
  rich: Rich,
  typing: NextTyping | null,
  start: number,
  end: number,
): FormatState {
  const style = styleAt(rich, typing, start, end);
  const lineStart = rich.text.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = rich.text.indexOf("\n", start);
  const line = rich.text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  return {
    bold: (style & BOLD) > 0,
    italic: (style & ITALIC) > 0,
    list: BULLET.test(line),
  };
}
