import { css } from "@linaria/core";
import { input } from "@/components/field/field.styles.ts";
import { panel } from "@/components/panel/panel.tsx";
import { tile } from "@/components/tile/tile.tsx";

export const scrim = css`
  position: fixed;
  top: var(--vvt, 0);
  left: 0;
  right: 0;
  height: var(--vvh, 100%);
  z-index: 50;
  display: flex;
  align-items: flex-end;
  background: var(--background-scrim);
  animation: fade-in var(--motion-slow) var(--motion-easing) both;

  @keyframes sheet-in {
    from {
      transform: translateY(var(--space-xl));
      opacity: 0;
    }
  }

  @keyframes sheet-out {
    to {
      transform: translateY(var(--space-xl));
      opacity: 0;
    }
  }
`;

export const sheet = css`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg) calc(var(--space-lg) + env(safe-area-inset-bottom));
  max-height: 100%;
  overflow-y: auto;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--background-secondary);
  animation: sheet-in var(--motion-slow) var(--motion-easing) both;
  position: relative;
  overscroll-behavior: contain;

  &::before {
    content: "";
    position: absolute;
    top: var(--space-sm);
    left: 50%;
    width: var(--size-handle);
    height: var(--size-handle-height);
    margin-left: calc(var(--size-handle) / -2);
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--text-secondary) 45%, transparent);
    cursor: grab;
  }

  & .${panel},
  & .${tile},
  & .${input} {
    background: var(--background-primary);
  }
`;

export const leaving = css`
  animation: fade-out var(--motion-fast) var(--motion-easing) both;

  & .${sheet} {
    animation: sheet-out var(--motion-fast) var(--motion-easing) both;
  }
`;

export const swiped = css`
  .${leaving}& .${sheet} {
    animation: none;
  }
`;

export const close = css`
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--background-primary);
  color: var(--text-secondary);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }

  &:active {
    background: var(--background-accent-soft);
  }
`;

export const head = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  & button[title] {
    margin-left: calc(-1 * var(--space-md));
    color: var(--text-primary);
  }

  & > :first-child {
    padding-right: var(--size-control);
  }
`;

export const context = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
`;

export const title = css`
  font-size: var(--font-size-body-xl);
  line-height: 1.25;
`;

export const quote = css`
  padding-left: var(--space-md);
  border-left: 3px solid var(--border-primary);
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: var(--font-size-body-md);
  line-height: 1.4;
`;

export const actions = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  & > button {
    width: 100%;
  }
`;
