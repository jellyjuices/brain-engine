import type { RefObject } from "react";

interface Piece {
  node: Node;
  text: string;
}

export interface CaretField {
  selectionStart: number;
  selectionEnd: number;
  focus(): void;
  setSelectionRange(start: number, end: number): void;
}

const BLOCKS = new Set(["DIV", "P", "LI"]);

function pieces(root: Node): Piece[] {
  const list: Piece[] = [];
  function visit(node: Node) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE)
        list.push({ node: child, text: child.textContent ?? "" });
      else if (child.nodeName === "BR") list.push({ node: child, text: "\n" });
      else {
        if (BLOCKS.has(child.nodeName) && child.previousSibling)
          list.push({ node: child, text: "\n" });
        visit(child);
      }
    }
  }
  visit(root);
  return list;
}

export function editableText(root: Node): string {
  return pieces(root)
    .map((p) => p.text)
    .join("");
}

function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(node, offset);
  const copy = document.createElement("div");
  copy.append(range.cloneContents());
  return editableText(copy).length;
}

function pointAt(root: HTMLElement, at: number): [Node, number] {
  let left = at;
  for (const p of pieces(root)) {
    if (p.node.nodeType === Node.TEXT_NODE) {
      if (left <= p.text.length) return [p.node, left];
    } else if (left === 0) {
      const parent = p.node.parentNode ?? root;
      return [parent, Array.prototype.indexOf.call(parent.childNodes, p.node)];
    }
    left -= p.text.length;
  }
  return [root, root.childNodes.length];
}

export function editableSelection(root: HTMLElement): { start: number; end: number } | null {
  const selection = document.getSelection();
  if (!selection?.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  return {
    start: offsetOf(root, range.startContainer, range.startOffset),
    end: offsetOf(root, range.endContainer, range.endOffset),
  };
}

export function selectEditable(root: HTMLElement, start: number, end: number) {
  const selection = document.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.setStart(...pointAt(root, start));
  range.setEnd(...pointAt(root, end));
  selection.removeAllRanges();
  selection.addRange(range);
}

export function editableField(ref: RefObject<HTMLElement | null>): CaretField {
  function read() {
    const root = ref.current;
    if (!root) return { start: 0, end: 0 };
    const length = editableText(root).length;
    return editableSelection(root) ?? { start: length, end: length };
  }
  return {
    get selectionStart() {
      return read().start;
    },
    get selectionEnd() {
      return read().end;
    },
    focus() {
      ref.current?.focus();
    },
    setSelectionRange(start: number, end: number) {
      if (ref.current) selectEditable(ref.current, start, end);
    },
  };
}
