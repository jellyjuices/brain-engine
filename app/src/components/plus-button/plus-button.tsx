import { css } from "@linaria/core";
import clsx from "clsx";
import { PlusIcon } from "@phosphor-icons/react";
import type { ButtonHTMLAttributes } from "react";

const shape = css`
  position: absolute;
  inset: 0;
  background: var(--plus-fill);
  clip-path: var(--shape-plus);
  transition: rotate var(--motion-slow) var(--motion-easing);

  @keyframes plus-button-spin {
    from {
      rotate: 0deg;
    }
    to {
      rotate: 180deg;
    }
  }
`;

const plusButton = css`
  position: relative;
  display: inline-grid;
  place-items: center;
  width: var(--size-plus);
  height: var(--size-plus);
  padding: 0;
  border: 0;
  background: none;
  border-radius: var(--radius-control);
  color: var(--plus-ink);
  cursor: pointer;
  filter: drop-shadow(var(--shadow-halo));

  &:active:not(:disabled) .${shape} {
    animation: plus-button-spin var(--motion-pop) var(--motion-easing) 1;
  }

  &:disabled {
    color: var(--text-disabled);
    cursor: not-allowed;
    filter: none;
  }

  &:disabled .${shape} {
    background: var(--background-disabled);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) .${shape} {
      animation: none;
    }
  }

  @media (hover: hover) {
    &:hover:not(:disabled) .${shape} {
      rotate: 30deg;
    }

    @media (prefers-reduced-motion: reduce) {
      &:hover:not(:disabled) .${shape} {
        rotate: 0deg;
      }
    }
  }
`;

const isRaised = css`
  .${plusButton}& {
    margin-top: calc(var(--space-xl) * -1);
  }
`;

const lg = css`
  width: calc(var(--size-plus) + var(--space-md));
  height: calc(var(--size-plus) + var(--space-md));
`;

const icon = css`
  position: relative;
  width: var(--size-icon);
  height: var(--size-icon);
`;

export type PlusButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "md" | "lg";
  raised?: boolean;
};

export const PlusButton = ({ label, size = "md", raised, className, ...rest }: PlusButtonProps) => (
  <button
    type="button"
    aria-label={label}
    className={clsx(plusButton, size === "lg" && lg, raised && isRaised, className)}
    {...rest}
  >
    <span className={shape} aria-hidden />
    <PlusIcon weight="bold" aria-hidden className={icon} />
  </button>
);
