import {
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { useMentions } from "@/components/mention-drawer/use-mentions.ts";
import { mentionName, setWhenWord } from "@/lib/notes/capture.ts";
import {
  insertTrigger,
  pasteText,
  prefixLines,
  pullTags,
  wrapMarks,
  type Edit,
} from "@/lib/notes/markers.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { editableField, editableText, writeEditable } from "@/lib/platform/editable.ts";

export type AddKind = "todo" | "journal";

export interface Saved {
  text: string;
  tags: string[];
}

export function useAddText(box: RefObject<HTMLDivElement | null>, kind: AddKind) {
  const [field] = useState(() => ({ current: editableField(box) }));
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const mentions = useMentions({
    area: field,
    from: "inbox/new.md",
    text,
    setText: write,
    tags,
    setTags,
    insert: (s: Suggestion) => {
      if (s.kind === "tag") return `#${s.value}`;
      if (s.kind === "subject") return mentionName(s);
      return kind === "journal" ? s.value : "";
    },
    finish: (s, value) =>
      s.kind === "date" && kind === "todo" ? setWhenWord(value, s.value) : value,
  });

  function write(next: string) {
    if (box.current) writeEditable(box.current, next);
    setText(next);
  }

  function apply(change: (value: string, start: number, end: number) => Edit) {
    const now = box.current ? editableText(box.current) : text;
    const next = change(now, field.current.selectionStart, field.current.selectionEnd);
    write(next.value);
    field.current.focus();
    field.current.setSelectionRange(next.start, next.end);
    mentions.track();
  }

  function onInput(e: FormEvent) {
    const root = box.current;
    const composing = (e.nativeEvent as InputEvent).isComposing;
    if (root && !composing && [...root.childNodes].some((n) => n.nodeType !== Node.TEXT_NODE)) {
      apply((v, s, en) => ({ value: v, start: s, end: en }));
      return;
    }
    setText(root ? editableText(root) : "");
    mentions.track();
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain");
    apply((v, s, en) => pasteText(v, s, en, pasted));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && mentions.suggestions.length) {
      e.preventDefault();
      mentions.dismiss();
    }
  }

  function saved(): Saved {
    const value = box.current ? editableText(box.current).trim() : "";
    return kind === "todo" ? pullTags(value, tags) : { text: value, tags: [] };
  }

  return {
    mentions,
    events: { onInput, onPaste, onSelect: mentions.track, onKeyDown },
    saved,
    bold: () => apply((v, s, e) => wrapMarks(v, s, e, "**")),
    italic: () => apply((v, s, e) => wrapMarks(v, s, e, "_")),
    list: () => apply((v, s, e) => prefixLines(v, s, e, "- ")),
    tag: () => apply((v, s, e) => insertTrigger(v, s, e, "#")),
    link: () => apply((v, s, e) => insertTrigger(v, s, e, "@")),
  };
}
