import { useImperativeHandle, useState, type KeyboardEvent, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AddInput } from "@/components/add-input/add-input.tsx";
import { MentionSuggestions } from "@/components/mention-suggestions/mention-suggestions.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { homeGuesses } from "@/lib/notes/home-guess.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { AddToolbar } from "./add-toolbar.tsx";
import { AddExpandButton } from "./add-expand-button.tsx";
import { DateChip } from "./date-chip.tsx";
import { DestinationChips } from "./destination-chips.tsx";
import { useAddText, type AddKind, type Saved } from "./use-add-text.ts";

export interface EditorSaved extends Saved {
  home: Suggestion | null;
}

export function AddEditor({
  box,
  reader,
  kind,
  initial,
  about,
  full,
  host,
  showBar,
  onToggleFull,
  onSubmit,
}: {
  box: RefObject<HTMLDivElement | null>;
  reader: Ref<() => EditorSaved>;
  kind: AddKind;
  initial?: string;
  about?: string;
  full: boolean;
  host: HTMLElement | null;
  showBar: boolean;
  onToggleFull: () => void;
  onSubmit: () => void;
}) {
  const words = useAddText(box, kind, initial);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
      return;
    }
    words.events.onKeyDown(e);
  }

  const { mentions } = words;
  const notes = useNotes();
  const [home, setHome] = useState<Suggestion | null>(null);
  const guesses = kind === "todo" && notes ? homeGuesses(notes, words.text) : [];
  const shown = home && !guesses.some((g) => g.key === home.key) ? [home, ...guesses] : guesses;
  useImperativeHandle(reader, () => () => ({ ...words.saved(), home }));

  const { when } = words;
  const drawer =
    mentions.kind && mentions.suggestions.length > 0 ? (
      <MentionSuggestions
        kind={mentions.kind}
        suggestions={mentions.suggestions}
        onPick={mentions.pick}
      />
    ) : when.open ? (
      <MentionSuggestions
        kind="date"
        suggestions={when.suggestions}
        onPick={(s) => when.set(s.value)}
      />
    ) : (
      <>
        {when.date && <DateChip date={when.date} onRemove={when.clear} />}
        {shown.length > 0 && (
          <DestinationChips suggestions={shown} picked={home?.key ?? null} onPick={setHome} />
        )}
      </>
    );

  const pickerOpen = mentions.suggestions.length > 0;
  const bar = (
    <AddToolbar
      journal={kind === "journal"}
      actions={words}
      pressed={{
        ...words.formats,
        tag: pickerOpen && mentions.kind === "tag",
        date: when.open,
        mention: pickerOpen && mentions.kind === "mention",
      }}
      drawer={drawer}
      end={kind === "journal" && <AddExpandButton full={full} onToggle={onToggleFull} />}
    />
  );

  return (
    <>
      <AddInput
        ref={box}
        kind={kind}
        about={about}
        full={full}
        {...words.events}
        onKeyDown={onKeyDown}
      />
      {host && showBar && createPortal(bar, host)}
    </>
  );
}
