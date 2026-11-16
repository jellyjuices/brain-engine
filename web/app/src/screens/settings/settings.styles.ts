import { css } from "@linaria/core";

export const switchStyle = css`
  position: relative;
  flex: none;
  width: calc(var(--size-icon) * 2 + var(--space-xs));
  height: var(--space-2xl);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--border-primary);
  transition: background var(--motion-fast) var(--motion-easing);

  &::after {
    content: "";
    position: absolute;
    top: var(--space-xs);
    left: var(--space-xs);
    width: var(--size-icon);
    height: var(--size-icon);
    border-radius: var(--radius-full);
    background: var(--background-secondary);
    box-shadow: var(--shadow-sm-light);
    transition: transform var(--motion-fast) var(--motion-easing);
  }

  &[aria-checked="true"] {
    background: var(--background-accent);
  }

  &[aria-checked="true"]::after {
    transform: translateX(var(--size-icon));
  }
`;

export const pendingRow = css`
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;
