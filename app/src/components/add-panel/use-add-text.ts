import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { LIVE_CLASSES } from "@/components/add-input/live-classes.ts";
import { useMentions } from "@/components/mention-suggestions/use-mentions.ts";
import { setWhenWord } from "@/lib/notes/capture.ts";
import type { Picked } from "@/lib/notes/live-marks.ts";
import { NO_FORMATS, formatState, type FormatState } from "@/lib/notes/format-state.ts";
import { insertTrigger, pasteText, prefixLines, pullTags, type Edit } from "@/lib/notes/markers.ts";
import { richSegments } from "@/lib/notes/rich-segments.ts";
import {
  BOLD,
  EMPTY_RICH,
  ITALIC,
  changedAt,
  replaceText,
  richMarkdown,
  toggleStyle,
  wordAt,
} from "@/lib/notes/rich-text.ts";
import { editableField, editableText } from "@/lib/platform/editable.ts";
import { placeLiveCaret, renderLive } from "@/lib/platform/live-render.ts";
import { pickedText } from "./picked-text.ts";
import { useAddDate } from "./use-add-date.ts";

export type AddKind = "todo" | "journal";

export interface Saved {
  text: string;
  tags: string[];
  date: string | null;
}

interface Typing {
  at: number;
  style: number;
}

export function useAddText(box: RefObject<HTMLDivElement | null>, kind: AddKind, initial?: string) {
  const [field] = useState(() => ({ current: editableField(box) }));
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [formats, setFormats] = useState<FormatState>(NO_FORMATS);
  const picked = useRef<Picked>({ names: [], tags: [] });
  const rich = useRef(EMPTY_RICH);
  const typing = useRef<Typing | null>(null);
  const when = useAddDate();
  const mentions = useMentions({
    area: field,
    from: "inbox/new.md",
    text,
    setText: write,
    tags,
    setTags,
    insert: (s) => pickedText(s, picked.current, when.set),
  });

  function paint() {
    if (box.current)
      renderLive(
        box.current,
        richSegments(rich.current, picked.current, kind === "journal"),
        LIVE_CLASSES,
      );
  }

  const seed = useRef(initial);
  useEffect(() => {
    if (!seed.current) return;
    write(seed.current);
    seed.current = undefined;
  });

  function take(next: string) {
    const at = changedAt(rich.current.text, next);
    const style = typing.current?.at === at ? typing.current.style : undefined;
    if (next !== rich.current.text) typing.current = null;
    rich.current = replaceText(rich.current, next, style);
  }

  function write(next: string) {
    take(next);
    paint();
    setText(next);
  }

  function syncFormats() {
    setFormats(
      formatState(
        rich.current,
        typing.current,
        field.current.selectionStart,
        field.current.selectionEnd,
      ),
    );
  }

  function place(start: number, end: number) {
    field.current.focus();
    if (box.current) placeLiveCaret(box.current, start, end, LIVE_CLASSES);
    mentions.track();
    syncFormats();
  }

  function apply(change: (value: string, start: number, end: number) => Edit) {
    const next = change(
      rich.current.text,
      field.current.selectionStart,
      field.current.selectionEnd,
    );
    write(next.value);
    place(next.start, next.end);
  }

  function style(bit: number) {
    const start = field.current.selectionStart;
    const end = field.current.selectionEnd;
    const [from, to] = wordAt(rich.current.text, start);
    if (start === end && from === to) {
      const now =
        typing.current?.at === start ? typing.current.style : (rich.current.styles[start - 1] ?? 0);
      typing.current = { at: start, style: now ^ bit };
    } else {
      rich.current = toggleStyle(rich.current, start, end, bit).rich;
      typing.current = start === end ? { at: start, style: rich.current.styles[from] ?? 0 } : null;
      paint();
    }
    place(start, end);
  }

  function onSelect() {
    const at = field.current.selectionStart;
    if (typing.current && typing.current.at !== at) typing.current = null;
    mentions.track();
    syncFormats();
  }

  function onInput(e: FormEvent) {
    const value = box.current ? editableText(box.current) : "";
    take(value);
    if (!(e.nativeEvent as InputEvent).isComposing) paint();
    setText(value);
    when.close();
    mentions.track();
    syncFormats();
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
      return;
    }
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const bit = { b: BOLD, i: ITALIC }[e.key.toLowerCase()];
    if (!bit) return;
    e.preventDefault();
    style(bit);
  }

  function saved(): Saved {
    if (box.current) take(editableText(box.current));
    const value = richMarkdown(rich.current).trim();
    if (kind === "journal") return { text: value, tags: [], date: when.date };
    const todo = pullTags(value, tags);
    const dated = when.date && todo.text ? setWhenWord(todo.text, when.date) : todo.text;
    return { text: dated, tags: todo.tags, date: null };
  }

  return {
    text,
    when,
    mentions,
    formats,
    events: { onInput, onPaste, onSelect, onKeyDown },
    saved,
    bold: () => style(BOLD),
    italic: () => style(ITALIC),
    list: () => apply((v, s, e) => prefixLines(v, s, e, "- ")),
    tag: () => apply((v, s, e) => insertTrigger(v, s, e, "#")),
    date: when.toggle,
    link: () => apply((v, s, e) => insertTrigger(v, s, e, "@")),
  };
}
