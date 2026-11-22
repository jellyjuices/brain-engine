import styles from "./add-input.module.css";
import type { ClipboardEvent, FormEvent, KeyboardEvent, Ref } from "react";
import clsx from "clsx";
import { copy } from "@/content/index.ts";

export interface AddInputProps {
  ref: Ref<HTMLDivElement>;
  kind: "todo" | "journal";
  about?: string;
  full: boolean;
  onInput: (e: FormEvent) => void;
  onPaste: (e: ClipboardEvent) => void;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

function inputWords(kind: AddInputProps["kind"], about?: string) {
  if (kind === "todo") return { label: copy.add.todo, hint: copy.add.todoHint };
  if (about) return { label: copy.common.note, hint: copy.add.noteAbout(about) };
  return { label: copy.add.journal, hint: copy.add.writePlaceholder };
}

export function AddInput({
  ref,
  kind,
  about,
  full,
  onInput,
  onPaste,
  onSelect,
  onKeyDown,
}: AddInputProps) {
  const words = inputWords(kind, about);
  return (
    <div
      ref={ref}
      className={clsx(
        styles.addInput,
        kind !== "todo" && styles.addInputJournal,
        full && styles.isFull,
      )}
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-label={words.label}
      data-placeholder={words.hint}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      onInput={onInput}
      onPaste={onPaste}
      onSelect={onSelect}
      onKeyUp={onSelect}
      onKeyDown={onKeyDown}
    />
  );
}
