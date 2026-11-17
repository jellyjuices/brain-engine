import { css } from "@linaria/core";
import clsx from "clsx";
import type { ComponentProps } from "react";
import type { Icon } from "@phosphor-icons/react";
import { hitArea } from "../hit-area/hit-area.ts";

const iconButton = css`
  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--size-control);
  height: var(--size-control);
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--motion-easing),
    scale var(--motion-fast) var(--motion-easing);

  &:active:not(:disabled) {
    scale: 0.92;
  }

  &:disabled {
    background: var(--background-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
    box-shadow: inset 0 0 0 var(--size-hair) var(--border-primary);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      scale: 1;
    }
  }
`;

const glyph = css`
  width: var(--size-icon);
  height: var(--size-icon);
`;

const sizes = {
  sm: css`
    width: calc(var(--size-control) - var(--space-md));
    height: calc(var(--size-control) - var(--space-md));

    & .${glyph} {
      width: var(--size-icon-sm);
      height: var(--size-icon-sm);
    }
  `,
  md: "",
  lg: css`
    width: calc(var(--size-control) + var(--space-md));
    height: calc(var(--size-control) + var(--space-md));
  `,
};

const variants = {
  primary: css`
    background: var(--background-accent);
    color: var(--text-on-accent);

    &:active:not(:disabled) {
      background:
        linear-gradient(var(--background-accent-pressed), var(--background-accent-pressed)),
        var(--background-accent);
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background:
          linear-gradient(var(--background-accent-hover), var(--background-accent-hover)),
          var(--background-accent);
      }
    }
  `,
  secondary: css`
    background: var(--background-accent-soft);
    color: var(--text-accent);

    &:active:not(:disabled) {
      background: var(--background-pressed);
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background:
          linear-gradient(var(--background-accent-soft-hover), var(--background-accent-soft-hover)),
          var(--background-accent-soft);
      }
    }
  `,
  ghost: css`
    background: transparent;
    color: var(--text-primary);

    &:active:not(:disabled) {
      background: var(--background-pressed);
    }

    &:disabled {
      background: transparent;
      box-shadow: none;
    }

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: var(--background-hover);
      }
    }
  `,
};

export type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: Icon;
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export const IconButton = ({
  icon: Glyph,
  label,
  variant = "ghost",
  size = "md",
  className,
  ...rest
}: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={clsx(iconButton, hitArea, variants[variant], sizes[size], className)}
    {...rest}
  >
    <Glyph aria-hidden weight={variant === "primary" ? "bold" : "regular"} className={glyph} />
  </button>
);
