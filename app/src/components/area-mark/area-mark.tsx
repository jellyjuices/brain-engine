import styles from "./area-mark.module.css";
import clsx from "clsx";
import { splitAreas } from "@/lib/design/area-mix.ts";
import { AreaShape } from "../area-shape/area-shape.tsx";

export type AreaMarkProps = {
  areas: string[];
  shape?: string;
  size?: "sm" | "md";
  label?: string;
};

export const AreaMark = ({ areas, shape = "circle", size = "sm", label }: AreaMarkProps) => {
  const { shown, extra: extraCount } = splitAreas(areas);
  if (shown.length === 0) return null;
  return (
    <span
      className={clsx(styles.areaMark, size === "md" && styles.md)}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <AreaShape areas={shown} shape={shape} size={size} />
      {extraCount > 0 && (
        <span className={styles.extra} aria-hidden>
          +{extraCount}
        </span>
      )}
    </span>
  );
};
