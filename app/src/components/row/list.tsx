import "./row.css";
import type { ReactNode } from "react";
import clsx from "clsx";

export interface ListProps {
  children: ReactNode;
  variant?: "outlined" | "ghost" | "menu";
  label?: string;
}

export function List({ children, variant = "outlined", label }: ListProps) {
  return (
    <div className={clsx("list", `list--${variant}`)} aria-label={label}>
      {children}
    </div>
  );
}
