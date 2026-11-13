import "./chip.css";
import { XIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import type { Size } from "@/components/button/button.tsx";

export interface ChipProps {
  children: ReactNode;
  variant?: "secondary" | "outlined";
  size?: Exclude<Size, "lg">;
  icon?: PhosphorIcon;
  label?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

export function Chip({
  children,
  variant = "secondary",
  size = "md",
  icon,
  label,
  onClick,
  onRemove,
}: ChipProps) {
  const className = clsx("chip", `chip--${variant}`, size === "sm" && "chip--sm");
  const inner = (
    <>
      {icon && <Icon icon={icon} />}
      {children}
      {onRemove && <Icon icon={XIcon} />}
    </>
  );
  const press = onRemove ?? onClick;
  if (!press)
    return (
      <span className={className} aria-label={label}>
        {inner}
      </span>
    );
  return (
    <button
      className={clsx(className, "chip--button")}
      type="button"
      aria-label={label}
      onClick={press}
    >
      {inner}
    </button>
  );
}
