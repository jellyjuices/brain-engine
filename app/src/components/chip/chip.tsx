import clsx from "clsx";
import { XIcon, type Icon } from "@phosphor-icons/react";
import { areaVar, splitAreas } from "@/lib/design/area-mix.ts";
import { copy } from "@/content/index.ts";
import hit from "../hit-area/hit-area.module.css";
import styles from "./chip.module.css";

export type ChipProps = {
  label: string;
  variant?: "tag" | "check" | "accent";
  icon?: Icon;
  ariaLabel?: string;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  areas?: string[];
};

export function Chip({
  label,
  variant = "tag",
  icon: Glyph,
  ariaLabel,
  onClick,
  onRemove,
  removeLabel,
  disabled,
  areas,
}: ChipProps) {
  const Body = onClick ? "button" : "span";
  const shownDots = splitAreas(areas);
  return (
    <span className={clsx(styles.chip, styles[variant], disabled && styles.disabled)}>
      <Body
        className={clsx(styles.slot, styles.labelSlot, onClick && hit.area)}
        aria-label={ariaLabel}
        {...(onClick ? { type: "button" as const, onClick, disabled } : {})}
      >
        {Glyph && <Glyph aria-hidden />}
        {shownDots.shown.length > 0 && (
          <span className={styles.dots} aria-hidden>
            {shownDots.shown.map((a) => (
              <span key={a} className={styles.dot} style={{ background: areaVar(a, "accent") }} />
            ))}
            {shownDots.extra > 0 && <span className={styles.dotsExtra}>+{shownDots.extra}</span>}
          </span>
        )}
        {label}
      </Body>
      {onRemove && (
        <button
          type="button"
          className={clsx(styles.slot, styles.removeSlot, hit.area)}
          aria-label={removeLabel ?? copy.common.remove(label)}
          onClick={onRemove}
          disabled={disabled}
        >
          <XIcon weight="bold" aria-hidden />
        </button>
      )}
    </span>
  );
}
