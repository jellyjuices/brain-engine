import { css } from "@linaria/core";
import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/icon/icon.tsx";

const button = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s1);
  flex: none;
  white-space: nowrap;
  min-height: var(--touch);
  padding: 0 var(--s3);
  border: var(--hair) solid transparent;
  border-radius: var(--pill);
  background: transparent;
  color: var(--ink);
  font-size: var(--t-md);
  font-weight: 600;
  transition:
    transform var(--fast) var(--ease),
    opacity var(--fast) var(--ease),
    background var(--fast) var(--ease);

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }

  & svg {
    width: var(--icon);
    height: var(--icon);
  }
`;

const isBlock = css`
  flex: auto;
  width: 100%;
`;

const isBusy = css`
  & svg {
    animation: spin 0.8s linear infinite;
  }
`;

const variants = {
  primary: css`
    background: var(--accent);
    color: var(--accent-ink);
  `,
  secondary: css`
    background: var(--accent-soft);
    color: var(--accent);
  `,
  outlined: css`
    border-color: var(--line);
  `,
  ghost: css`
    color: var(--accent);
  `,
  danger: css`
    border-color: var(--line);
    color: var(--danger);
  `,
};

const sizes = {
  sm: css`
    min-height: var(--control-sm);
    padding: 0 var(--s2);
    font-size: var(--t-sm);
  `,
  md: "",
  lg: css`
    min-height: var(--row);
    font-size: var(--t-lg);
  `,
};

const isIconOnly = css`
  padding: 0;
  aspect-ratio: 1;
`;

export type ButtonVariant = keyof typeof variants;
export type Size = keyof typeof sizes;

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
        button,
        variants[variant],
        sizes[size],
        block && isBlock,
        !children && isIconOnly,
        busy && isBusy,
        className,
      )}
      {...rest}
    >
      {icon && <Icon icon={icon} />}
      {children}
    </button>
  );
}
