import { css } from "@linaria/core";
import clsx from "clsx";
import { XIcon } from "@phosphor-icons/react";
import { areaVar, splitAreas } from "@/lib/design/area-mix.ts";
import { hitArea } from "../hit-area/hit-area.ts";

const chip = css`
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-control);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--font-leading-snug);
  white-space: nowrap;
`;

const slot = css`
  display: inline-flex;
  align-items: center;
  padding: var(--space-2xs) var(--space-sm);
  border: 0;
  background: none;
  border-radius: var(--radius-control);
  font-size: inherit;
  font-weight: inherit;
`;

const labelSlot = css`
  gap: var(--space-xs);

  button& {
    cursor: pointer;
    transition: background-color var(--motion-fast) var(--motion-easing);
  }

  button&:active {
    background: var(--background-pressed);
  }

  @media (hover: hover) {
    button&:hover {
      background: var(--background-hover);
    }
  }
`;

const removeSlot = css`
  cursor: pointer;
  transition: background-color var(--motion-fast) var(--motion-easing);
  padding-left: 0;

  & svg {
    width: var(--font-size-body-xs);
    height: var(--font-size-body-xs);
  }

  &:active {
    background: var(--background-pressed);
  }

  @media (hover: hover) {
    &:hover {
      background: var(--background-hover);
    }
  }
`;

const dots = css`
  display: inline-flex;
`;

const dot = css`
  width: var(--size-dot);
  height: var(--size-dot);
  border-radius: var(--radius-control);
  box-shadow: 0 0 0 var(--size-hair) var(--background-secondary);

  & + & {
    margin-left: calc(var(--size-dot) / -3);
  }
`;

const dotsExtra = css`
  margin-left: var(--space-2xs);
  font-family: var(--font-number);
  font-size: var(--font-size-number-xs);
`;

const variants = {
  tag: css`
    background: var(--background-tag);
    color: var(--text-tag);
  `,
  check: css`
    background: var(--background-check);
    color: var(--status-check);
  `,
  accent: css`
    background: var(--background-accent-soft);
    color: var(--text-accent);

    @media (hover: hover) {
      & button.${labelSlot}:hover {
        background: var(--background-accent-soft-hover);
      }
    }
  `,
};

const isDisabled = css`
  .${chip}& {
    background: var(--background-disabled);
    color: var(--text-disabled);
  }

  .${chip}& button {
    cursor: not-allowed;
  }
`;

export type ChipProps = {
  label: string;
  variant?: "tag" | "check" | "accent";
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
  areas?: string[];
};

export const Chip = ({
  label,
  variant = "tag",
  onClick,
  onRemove,
  removeLabel,
  disabled,
  areas,
}: ChipProps) => {
  const Body = onClick ? "button" : "span";
  const shownDots = splitAreas(areas);
  return (
    <span className={clsx(chip, variants[variant], disabled && isDisabled)}>
      <Body
        className={clsx(slot, labelSlot, onClick && hitArea)}
        {...(onClick ? { type: "button" as const, onClick, disabled } : {})}
      >
        {shownDots.shown.length > 0 && (
          <span className={dots} aria-hidden>
            {shownDots.shown.map((a) => (
              <span key={a} className={dot} style={{ background: areaVar(a, "accent") }} />
            ))}
            {shownDots.extra > 0 && <span className={dotsExtra}>+{shownDots.extra}</span>}
          </span>
        )}
        {label}
      </Body>
      {onRemove && (
        <button
          type="button"
          className={clsx(slot, removeSlot, hitArea)}
          aria-label={removeLabel ?? `Remove ${label}`}
          onClick={onRemove}
          disabled={disabled}
        >
          <XIcon weight="bold" aria-hidden />
        </button>
      )}
    </span>
  );
};
