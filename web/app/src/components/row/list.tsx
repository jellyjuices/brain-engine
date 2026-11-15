import * as s from "./row.styles.ts";
import type { ReactNode } from "react";
import clsx from "clsx";

export interface ListProps {
  children: ReactNode;
  variant?: "outlined" | "ghost" | "menu";
  label?: string;
}

export function List({ children, variant = "outlined", label }: ListProps) {
  return (
    <div className={clsx(s.list, s.lists[variant])} aria-label={label}>
      {children}
    </div>
  );
}
