import {
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { LIVE_CLASSES } from "@/components/add-box/live-classes.ts";
import { useMentions } from "@/components/mention-drawer/use-mentions.ts";
import { mentionName, setWhenWord } from "@/lib/notes/capture.ts";
import { liveSegments, type Picked } from "@/lib/notes/live-marks.ts";
import {
  insertTrigger,
  pasteText,
  prefixLines,
  pullTags,
  toggleMarks,
  type Edit,
} from "@/lib/notes/markers.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { editableField, editableText } from "@/lib/platform/editable.ts";
import { placeLiveCaret, renderLive } from "@/lib/platform/live-render.ts";

export type AddKind = "todo" | "journal";

export interface Saved {
  text: string;
  tags: string[];
}

export function useAddText(box: RefObject<HTMLDivElement | null>, kind: AddKind) {
  const [field] = useState(() => ({ current: editableField(box) }));
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const picked = useRef<Picked>({ names: [], tags: [] });
  const mentions = useMentions({
    area: field,
    from: "inbox/new.md",
    text,
    setText: write,
    tags,
    setTags,
    insert: (s: Suggestion) => {
      if (s.kind === "tag") {
        picked.current.tags.push(s.value);
        return `#${s.value}`;
      }
      if (s.kind === "subject") {
        const name = mentionName(s);
        picked.current.names.push(name);
        return `@${name}`;
      }
      return kind === "journal" ? s.value : "";
    },
    finish: (s, value) =>
      s.kind === "date" && kind === "todo" ? setWhenWord(value, s.value) : value,
  });

  function paint(value: string) {
    if (box.current)
      renderLive(
        box.current,
        liveSegments(value, picked.current, kind === "journal"),
        LIVE_CLASSES,
      );
  }

  function write(next: string) {
    paint(next);
    setText(next);
  }

  function apply(change: (value: string, start: number, end: number) => Edit) {
    const now = box.current ? editableText(box.current) : text;
    const next = change(now, field.current.selectionStart, field.current.selectionEnd);
    write(next.value);
    field.current.focus();
    if (box.current) placeLiveCaret(box.current, next.start, next.end, LIVE_CLASSES);
    mentions.track();
  }

  function onInput(e: FormEvent) {
    const value = box.current ? editableText(box.current) : "";
    if (!(e.nativeEvent as InputEvent).isComposing) paint(value);
    setText(value);
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
      return;
    }
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const mark = { b: "**", i: "_" }[e.key.toLowerCase()];
    if (!mark) return;
    e.preventDefault();
    apply((v, s, en) => toggleMarks(v, s, en, mark));
  }

  function saved(): Saved {
    const value = box.current ? editableText(box.current).trim() : "";
    return kind === "todo" ? pullTags(value, tags) : { text: value, tags: [] };
  }

  return {
    mentions,
    events: { onInput, onPaste, onSelect: mentions.track, onKeyDown },
    saved,
    bold: () => apply((v, s, e) => toggleMarks(v, s, e, "**")),
    italic: () => apply((v, s, e) => toggleMarks(v, s, e, "_")),
    list: () => apply((v, s, e) => prefixLines(v, s, e, "- ")),
    tag: () => apply((v, s, e) => insertTrigger(v, s, e, "#")),
    link: () => apply((v, s, e) => insertTrigger(v, s, e, "@")),
  };
}
