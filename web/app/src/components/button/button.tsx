import "./button.css";
import type { MouseEvent, ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export type ButtonVariant = "primary" | "secondary" | "outlined" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: Size;
  block?: boolean;
  icon?: PhosphorIcon;
  type?: "button" | "submit";
  disabled?: boolean;
  hidden?: boolean;
  busy?: boolean;
  autoFocus?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  block,
  icon,
  type = "button",
  disabled,
  hidden,
  busy,
  autoFocus,
  onClick,
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "btn",
        `btn--${variant}`,
        size !== "md" && `btn--${size}`,
        block && "btn--block",
        busy && "is-busy",
      )}
      type={type}
      disabled={disabled}
      hidden={hidden}
      autoFocus={autoFocus}
      onClick={onClick}
    >
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  );
}
