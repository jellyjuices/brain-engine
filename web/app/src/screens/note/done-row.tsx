import clsx from "clsx";
import { mdBox, mdBoxOn, mdCheck, mdCheckDone, mdCheckText } from "@/components/markdown/markdown.styles.ts";
import "@/components/markdown/markdown.css";

export function DoneRow({ text }: { text: string }) {
  return (
    <div className={clsx(mdCheck, mdCheckDone)} role="checkbox" aria-checked="true" aria-readonly="true">
      <span className={clsx(mdBox, mdBoxOn)} aria-hidden="true" />
      <span className={mdCheckText}>{text}</span>
    </div>
  );
}
