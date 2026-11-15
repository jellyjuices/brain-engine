import * as s from "./markdown.styles.ts";
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
      className={clsx(s.mdCheck, checked && s.mdCheckDone)}
      role="checkbox"
      aria-checked={checked}
      aria-readonly="true"
    >
      <span className={clsx(s.mdBox, checked && s.mdBoxOn)} aria-hidden="true" />
      <span className={s.mdCheckText}>
        <InlineText tokens={inline(text, from)} />
      </span>
    </div>
  );
}
