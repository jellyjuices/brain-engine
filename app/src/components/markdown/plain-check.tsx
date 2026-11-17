import "./markdown.css";
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
      className={clsx("md-check", checked && "is-done")}
      role="checkbox"
      aria-checked={checked}
      aria-readonly="true"
    >
      <span className={clsx("md-box", checked && "is-on")} aria-hidden="true" />
      <span className="md-check-text">
        <InlineText tokens={inline(text, from)} />
      </span>
    </div>
  );
}
