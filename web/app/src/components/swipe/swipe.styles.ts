import { css } from "@linaria/core";
import { list, row } from "@/components/row/row.styles.ts";

export const swipeBg = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-xl);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-body-sm);
  color: var(--text-on-accent);
  visibility: hidden;

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

export const bgRight = css`
  display: none;
  align-items: center;
  gap: var(--space-sm);
`;

export const bgLeft = css`
  display: none;
  align-items: center;
  gap: var(--space-sm);
`;

export const swipe = css`
  position: relative;
  overflow: hidden;
  transition:
    height var(--motion-slow) var(--motion-easing),
    opacity var(--motion-fast) var(--motion-easing);

  &[data-dir] .${swipeBg} {
    visibility: visible;
  }

  &[data-dir="right"] .${swipeBg} {
    background: var(--background-accent);
  }

  &[data-dir="left"] .${swipeBg} {
    background: var(--text-primary);
    color: var(--background-primary);
    justify-content: flex-end;
  }

  &[data-dir="right"] .${bgRight},
  &[data-dir="left"] .${bgLeft} {
    display: inline-flex;
  }

  &[data-armed] .${swipeBg} {
    filter: brightness(1.08);
  }
`;

export const isGone = css`
  .${swipe}& {
    opacity: 0;
  }

  .${list} > .${swipe}&:not(:first-child) {
    border-top-color: transparent;
  }
`;

export const swipeMain = css`
  position: relative;
  background: var(--background-secondary);
  touch-action: pan-y;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  & > .${row}:active {
    background: color-mix(in srgb, var(--background-secondary) 92%, var(--text-primary));
  }
`;

export const isSettling = css`
  .${swipeMain}& {
    transition: transform var(--motion-slow) var(--motion-easing);
  }
`;
