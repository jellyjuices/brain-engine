import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/icon/icon.tsx";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "outlined" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children?: ButtonHTMLAttributes<HTMLButtonElement>["children"];
  variant?: ButtonVariant;
  size?: Size;
  block?: boolean;
  icon?: PhosphorIcon;
  busy?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  icon,
  busy,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        styles.button,
        styles[variant],
        size !== "md" && styles[size],
        block && styles.block,
        !children && styles.iconOnly,
        busy && styles.busy,
        className,
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  );
}
