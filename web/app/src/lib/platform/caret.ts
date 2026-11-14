export function keepCaretInView(area: HTMLElement | null): void {
  const selection = document.getSelection();
  if (!area || !selection?.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!area.contains(range.endContainer)) return;
  const caret = range.getBoundingClientRect();
  const box = area.getBoundingClientRect();
  if (caret.height === 0) {
    area.scrollTop = area.scrollHeight;
    return;
  }
  if (caret.bottom > box.bottom) area.scrollTop += caret.bottom - box.bottom + caret.height;
  else if (caret.top < box.top) area.scrollTop -= box.top - caret.top + caret.height;
}
