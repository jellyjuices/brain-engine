import { useImperativeHandle, type Ref, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AddBox } from "@/components/add-box/add-box.tsx";
import { MentionDrawer } from "@/components/mention-drawer/mention-drawer.tsx";
import { AddBar } from "./add-bar.tsx";
import { AddFull } from "./add-full.tsx";
import { useAddText, type AddKind, type Saved } from "./use-add-text.ts";

export function AddEditor({
  box,
  reader,
  kind,
  full,
  host,
  showBar,
  onToggleFull,
}: {
  box: RefObject<HTMLDivElement | null>;
  reader: Ref<() => Saved>;
  kind: AddKind;
  full: boolean;
  host: HTMLElement | null;
  showBar: boolean;
  onToggleFull: () => void;
}) {
  const words = useAddText(box, kind);
  const { mentions } = words;
  useImperativeHandle(reader, () => words.saved);

  const bar = (
    <AddBar
      journal={kind === "journal"}
      actions={words}
      drawer={
        mentions.kind &&
        mentions.suggestions.length > 0 && (
          <MentionDrawer
            kind={mentions.kind}
            suggestions={mentions.suggestions}
            onPick={mentions.pick}
          />
        )
      }
      end={kind === "journal" && <AddFull full={full} onToggle={onToggleFull} />}
    />
  );

  return (
    <>
      <AddBox ref={box} kind={kind} full={full} {...words.events} />
      {host && showBar && createPortal(bar, host)}
    </>
  );
}
