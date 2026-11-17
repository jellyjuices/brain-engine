import { Children, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./list.module.css";

export interface ListProps {
  children: ReactNode;
  variant?: "outlined" | "ghost" | "menu" | "plain";
  label?: string;
}

export function List({ children, variant = "outlined", label }: ListProps) {
  return (
    <ul className={clsx(styles.list, styles[variant])} aria-label={label}>
      {Children.toArray(children).map((child, i) => (
        <li key={i} className={styles.item}>
          {child}
        </li>
      ))}
    </ul>
  );
}
