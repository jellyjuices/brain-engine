import { useState, type RefObject } from "react";
import { useNotes } from "@/hooks/use-notes.ts";
import { tagsInUse } from "@/lib/notes/capture.ts";
import {
  findTrigger,
  mentionSuggestions,
  replaceTrigger,
  tagSuggestions,
  type Suggestion,
} from "@/lib/notes/mention.ts";
import { todayIso } from "@/lib/notes/model.ts";

interface Options {
  area: RefObject<HTMLTextAreaElement | null>;
  from: string;
  text: string;
  setText: (next: string) => void;
  tags: string[];
  setTags: (next: string[]) => void;
  insert?: (s: Suggestion) => string;
  finish?: (s: Suggestion, value: string) => string;
}

function asLink(s: Suggestion) {
  return s.value;
}

function asIs(_s: Suggestion, value: string) {
  return value;
}

export function useMentions({
  area,
  from,
  text,
  setText,
  tags,
  setTags,
  insert = asLink,
  finish = asIs,
}: Options) {
  const notes = useNotes();
  const [caret, setCaret] = useState<number | null>(null);
  const [closedAt, setClosedAt] = useState<number | null>(null);
  const trigger = caret === null ? null : findTrigger(text, caret);
  const open = trigger && trigger.start !== closedAt ? trigger : null;

  let suggestions: Suggestion[] = [];
  if (open && notes) {
    suggestions =
      open.kind === "mention"
        ? mentionSuggestions(notes, from, todayIso(), open.query)
        : tagSuggestions(tagsInUse(notes), tags, open.query);
  }

  function track() {
    const field = area.current;
    if (field) setCaret(field.selectionStart === field.selectionEnd ? field.selectionStart : null);
  }

  function pick(s: Suggestion) {
    if (!open || caret === null) return;
    const next = replaceTrigger(text, open, caret, s.kind === "tag" ? "" : insert(s));
    if (s.kind === "tag") setTags([...tags, s.value]);
    const value = finish(s, next.value);
    const at = next.caret + value.length - next.value.length;
    setText(value);
    setCaret(at);
    requestAnimationFrame(() => {
      area.current?.focus();
      area.current?.setSelectionRange(at, at);
    });
  }

  function dismiss() {
    if (open) setClosedAt(open.start);
  }

  return { kind: open?.kind, suggestions, track, pick, dismiss };
}
