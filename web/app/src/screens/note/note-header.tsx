import { cardType } from "@/components/card/card-type.ts";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { IconButton } from "@ds/components/icon-button/icon-button.tsx";
import { copy } from "@/content/index.ts";

export interface NoteHeaderProps {
  title: string;
  type?: string;
  editor?: boolean;
  backLabel?: string;
  onBack: () => void;
  right?: ReactNode;
}

export function NoteHeader({
  title,
  type,
  editor,
  backLabel = copy.common.back,
  onBack,
  right,
}: NoteHeaderProps) {
  return (
    <header className={clsx("note-head", editor && "editor-head")}>
      <IconButton icon={CaretLeftIcon} label={backLabel} onClick={onBack} />
      <div className="note-head-main">
        <h1 className="serif note-title">{title}</h1>
        {type && <span className={cardType}>{type}</span>}
      </div>
      {right ?? <span className="head-spacer" />}
    </header>
  );
}
