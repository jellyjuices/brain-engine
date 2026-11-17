import styles from "./add-box.module.css";
import type { Ref } from "react";
import clsx from "clsx";
import { copy } from "@/content/index.ts";

export interface AddBoxProps {
  ref: Ref<HTMLDivElement>;
  kind: "todo" | "journal";
  full: boolean;
}

export function AddBox({ ref, kind, full }: AddBoxProps) {
  const todo = kind === "todo";
  return (
    <div
      ref={ref}
      className={clsx(styles.addBox, !todo && styles.addBoxJournal, full && styles.isFull)}
      role="textbox"
      tabIndex={0}
      aria-multiline="true"
      aria-label={todo ? copy.add.todo : copy.add.journal}
      data-placeholder={todo ? copy.add.todoHint : copy.add.writePlaceholder}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
    />
  );
}
