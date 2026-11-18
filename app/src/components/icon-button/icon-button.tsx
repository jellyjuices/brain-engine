import clsx from "clsx";
import type { ComponentProps } from "react";
import type { Icon } from "@phosphor-icons/react";
import hit from "../hit-area/hit-area.module.css";
import styles from "./icon-button.module.css";

export type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: Icon;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  pressed?: boolean;
};

export function IconButton({
  icon: Glyph,
  label,
  variant = "ghost",
  size = "md",
  pressed,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={clsx(
        styles.iconButton,
        hit.area,
        styles[variant],
        size !== "md" && styles[size],
        className,
      )}
      {...rest}
    >
      <Glyph
        aria-hidden
        weight={variant === "primary" ? "bold" : "regular"}
        className={styles.glyph}
      />
    </button>
  );
}
