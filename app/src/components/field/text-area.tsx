import type { ComponentProps } from "react";
import clsx from "clsx";
import styles from "./text-area.module.css";

export function TextArea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={clsx(styles.textArea, className)} />;
}
