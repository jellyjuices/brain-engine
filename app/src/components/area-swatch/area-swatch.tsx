import styles from "./area-swatch.module.css";
import clsx from "clsx";
import { mixGradient, mixSplit } from "@/lib/design/area-mix.ts";

export type AreaSwatchProps = {
  areas: string[];
  shape?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export const AreaSwatch = ({ areas, shape = "cookie", size = "md", label }: AreaSwatchProps) => (
  <span
    className={clsx(styles.areaSwatch, size !== "md" && styles[size])}
    role={label ? "img" : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
    style={{
      clipPath: `var(--shape-${shape})`,
      background: size === "sm" ? mixSplit(areas, "fill") : mixGradient(areas, "fill"),
    }}
  />
);
