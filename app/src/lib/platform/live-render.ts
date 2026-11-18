import type { Mark, Segment } from "@/lib/notes/live-marks.ts";
import { editableSelection } from "./editable.ts";

export type MarkClasses = Record<Mark, string>;

function build(segments: Segment[], classes: MarkClasses): HTMLDivElement {
  const draft = document.createElement("div");
  for (const seg of segments) {
    if (!seg.marks.length) {
      draft.append(seg.text);
      continue;
    }
    const span = document.createElement("span");
    span.className = seg.marks.map((m) => classes[m]).join(" ");
    span.textContent = seg.text;
    draft.append(span);
  }
  if (draft.lastChild?.nodeType !== Node.TEXT_NODE) draft.append(document.createTextNode(""));
  return draft;
}

function isHidden(node: Node, root: HTMLElement, classes: MarkClasses): boolean {
  const parent = node.parentElement;
  if (!parent || parent === root) return false;
  return parent.classList.contains(classes.mark) || parent.classList.contains(classes.bullet);
}

function pointAt(root: HTMLElement, at: number, classes: MarkClasses): [Node, number] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let left = at;
  let fallback: [Node, number] | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (left <= length) {
      if (!isHidden(node, root, classes)) return [node, left];
      fallback ??= [node, left];
      if (left < length) return fallback;
    }
    left -= length;
  }
  return fallback ?? [root, root.childNodes.length];
}

export function placeLiveCaret(
  root: HTMLElement,
  start: number,
  end: number,
  classes: MarkClasses,
) {
  const selection = document.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(...pointAt(root, start, classes));
  range.setEnd(...pointAt(root, end, classes));
  selection.removeAllRanges();
  selection.addRange(range);
}

export function renderLive(root: HTMLElement, segments: Segment[], classes: MarkClasses) {
  const draft = build(segments, classes);
  if (draft.innerHTML === root.innerHTML) return;
  const focused = document.activeElement === root;
  const caret = focused ? editableSelection(root) : null;
  root.replaceChildren(...draft.childNodes);
  if (caret) placeLiveCaret(root, caret.start, caret.end, classes);
}
