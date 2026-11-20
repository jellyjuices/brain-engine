import styles from "./area-indicator.module.css";
import clsx from "clsx";
import { splitAreas } from "@/lib/design/area-mix.ts";
import { AreaSwatch } from "../area-swatch/area-swatch.tsx";

export type AreaIndicatorProps = {
  areas: string[];
  shape?: string;
  size?: "sm" | "md";
  label?: string;
};

export const AreaIndicator = ({
  areas,
  shape = "circle",
  size = "sm",
  label,
}: AreaIndicatorProps) => {
  const { shown, extra: extraCount } = splitAreas(areas);
  if (shown.length === 0) return null;
  return (
    <span
      className={clsx(styles.areaIndicator, size === "md" && styles.md)}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <AreaSwatch areas={shown} shape={shape} size={size} />
      {extraCount > 0 && (
        <span className={styles.extra} aria-hidden>
          +{extraCount}
        </span>
      )}
    </span>
  );
};
