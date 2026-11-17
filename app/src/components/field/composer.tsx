import type { ComponentProps } from "react";
import clsx from "clsx";
import styles from "./composer.module.css";

export function Composer({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea {...rest} className={clsx(styles.composer, className)} />;
}
