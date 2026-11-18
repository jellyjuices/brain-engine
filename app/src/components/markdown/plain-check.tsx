import styles from "./markdown.module.css";
import clsx from "clsx";
import { InlineText } from "./inline-text.tsx";
import { inline } from "@/lib/notes/markdown.ts";

export function PlainCheck({
  text,
  checked,
  from,
}: {
  text: string;
  checked: boolean;
  from: string;
}) {
  return (
    <div
      className={clsx(styles.mdCheck, checked && styles.isDone)}
      role="checkbox"
      aria-checked={checked}
      aria-readonly="true"
    >
      <span className={clsx(styles.mdBox, checked && styles.isOn)} aria-hidden="true" />
      <span className={styles.mdCheckText}>
        <InlineText tokens={inline(text, from)} />
      </span>
    </div>
  );
}
