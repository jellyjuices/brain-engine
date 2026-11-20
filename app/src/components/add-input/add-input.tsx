import styles from "./add-input.module.css";
import type { ClipboardEvent, FormEvent, KeyboardEvent, Ref } from "react";
import clsx from "clsx";
import { copy } from "@/content/index.ts";

export interface AddInputProps {
  ref: Ref<HTMLDivElement>;
  kind: "todo" | "journal";
  full: boolean;
  onInput: (e: FormEvent) => void;
  onPaste: (e: ClipboardEvent) => void;
  onSelect: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
}

export function AddInput({
  ref,
  kind,
  full,
  onInput,
  onPaste,
  onSelect,
  onKeyDown,
}: AddInputProps) {
  const todo = kind === "todo";
  return (
    <div
      ref={ref}
      className={clsx(styles.addInput, !todo && styles.addInputJournal, full && styles.isFull)}
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-label={todo ? copy.add.todo : copy.add.journal}
      data-placeholder={todo ? copy.add.todoHint : copy.add.writePlaceholder}
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
