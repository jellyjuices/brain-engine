import { useImperativeHandle, useState, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AddInput } from "@/components/add-input/add-input.tsx";
import { MentionSuggestions } from "@/components/mention-suggestions/mention-suggestions.tsx";
import { useNotes } from "@/hooks/use-notes.ts";
import { homeGuesses } from "@/lib/notes/home-guess.ts";
import type { Suggestion } from "@/lib/notes/mention.ts";
import { AddToolbar } from "./add-toolbar.tsx";
import { AddExpandButton } from "./add-expand-button.tsx";
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
  full,
  host,
  showBar,
  onToggleFull,
}: {
  box: RefObject<HTMLDivElement | null>;
  reader: Ref<() => EditorSaved>;
  kind: AddKind;
  initial?: string;
  full: boolean;
  host: HTMLElement | null;
  showBar: boolean;
  onToggleFull: () => void;
}) {
  const words = useAddText(box, kind, initial);
  const { mentions } = words;
  const notes = useNotes();
  const [home, setHome] = useState<Suggestion | null>(null);
  const guesses = kind === "todo" && notes ? homeGuesses(notes, words.text) : [];
  const shown = home && !guesses.some((g) => g.key === home.key) ? [home, ...guesses] : guesses;
  useImperativeHandle(reader, () => () => ({ ...words.saved(), home }));

  const drawer =
    mentions.kind && mentions.suggestions.length > 0 ? (
      <MentionSuggestions
        kind={mentions.kind}
        suggestions={mentions.suggestions}
        onPick={mentions.pick}
      />
    ) : (
      shown.length > 0 && (
        <DestinationChips suggestions={shown} picked={home?.key ?? null} onPick={setHome} />
      )
    );

  const pickerOpen = mentions.suggestions.length > 0;
  const bar = (
    <AddToolbar
      journal={kind === "journal"}
      actions={words}
      pressed={{
        ...words.formats,
        tag: pickerOpen && mentions.kind === "tag",
        mention: pickerOpen && mentions.kind === "mention",
      }}
      drawer={drawer}
      end={kind === "journal" && <AddExpandButton full={full} onToggle={onToggleFull} />}
    />
  );

  return (
    <>
      <AddInput ref={box} kind={kind} full={full} {...words.events} />
      {host && showBar && createPortal(bar, host)}
    </>
  );
}
