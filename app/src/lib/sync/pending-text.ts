import type { OutboxItem } from "./outbox.ts";
import { copy } from "@/content/index.ts";

const CHANGE_WORD = {
  done: copy.toast.changeDone,
  move: copy.toast.changeMoved,
  drop: copy.toast.changeDropped,
  edit: copy.toast.changeEdited,
};

function isChange(kind: string): kind is keyof typeof CHANGE_WORD {
  return kind in CHANGE_WORD;
}

export function pendingText(item: OutboxItem): string {
  const p = item.payload as { text?: string; path?: string; ref?: string; question?: string };
  if (item.kind === "inbox") return p.text?.trim() || copy.toast.emptyAdd;
  if (p.question) return p.question;
  const what = p.path ?? p.ref;
  if (item.kind === "undo") return copy.toast.changeUndo;
  return isChange(item.kind) ? CHANGE_WORD[item.kind](what ?? "") : item.kind;
}
