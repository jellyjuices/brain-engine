import { css } from "@linaria/core";
import { XIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import type { ButtonProps } from "@ds/components/button/button.tsx";

const chip = css`
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--space-2xl);
  padding: 0 var(--space-md);
  border: var(--size-hair) solid transparent;
  border-radius: var(--radius-full);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;

  & svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }
`;

const variants = {
  secondary: css`
    background: var(--background-accent-soft);
    color: var(--text-accent);
  `,
  outlined: css`
    border-color: var(--border-primary);
    color: var(--text-secondary);
  `,
};

const small = css`
  .${chip}& {
    gap: var(--space-xs);
    min-height: var(--space-xl);
    padding: 0 var(--space-sm);
    font-size: var(--font-size-body-xs);
  }
`;

const pressable = css`
  .${chip}& {
    min-height: 40px;
    cursor: pointer;
  }

  .${chip}&:active {
    filter: brightness(0.95);
  }
`;

export const chips = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

export interface ChipProps {
  children: ReactNode;
  variant?: "secondary" | "outlined";
  size?: Exclude<ButtonProps["size"], "lg">;
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
  const className = clsx(chip, variants[variant], size === "sm" && small);
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
      className={clsx(className, pressable)}
      type="button"
      aria-label={label}
      onClick={press}
    >
      {inner}
    </button>
  );
}
