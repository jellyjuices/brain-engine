import { css } from '@linaria/core'

export const row = css`
  position: relative;
  overflow: hidden;
  list-style: none;
  background: var(--background-primary);
`

export const actions = css`
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
`

export const action = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: var(--size-action);
  border: 0;
  color: var(--action-ink);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }

  &:focus-visible {
    outline-color: var(--action-ink);
    outline-offset: calc(var(--size-focus) * -2);
  }
`

export const actionSort = css`
  background: var(--action-sort);
`

export const actionDrop = css`
  background: var(--action-drop);
`

export const tick = css`
  z-index: 1;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size-tick);
  height: var(--size-tick);
  margin-top: var(--space-2xs);
  padding: 0;
  border: var(--size-focus) solid var(--border-strong);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-on-accent);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing),
    scale var(--motion-fast) var(--motion-easing);

  &:active:not(:disabled) {
    scale: 0.9;
  }

  &[data-state='checked'] {
    border-color: var(--status-done);
    background: var(--status-done);
  }

  @media (prefers-reduced-motion: reduce) {
    &:active:not(:disabled) {
      scale: 1;
    }
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: var(--status-done);
    }
  }
`

export const content = css`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: var(--background-primary);
  touch-action: pan-y;
  transition: transform var(--motion-slow) var(--motion-easing);

  &:has(.${tick}:active) {
    background:
      linear-gradient(var(--background-pressed), var(--background-pressed)),
      var(--background-primary);
  }

  @media (hover: hover) {
    &:hover {
      background:
        linear-gradient(var(--background-hover), var(--background-hover)),
        var(--background-primary);
    }
  }
`

export const mark = css`
  display: grid;
  place-items: center;
  animation: todo-row-pop var(--motion-pop) var(--motion-easing) 1;

  & svg {
    width: var(--font-size-body-xs);
    height: var(--font-size-body-xs);
  }

  @keyframes todo-row-pop {
    0% {
      scale: 0.4;
    }
    60% {
      scale: 1.15;
    }
    100% {
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

export const body = css`
  flex: 1;
  min-width: 0;
`

export const title = css`
  display: block;
  font-size: var(--font-size-body-md);
  line-height: var(--font-leading-snug);
  cursor: pointer;
`

export const open = css`
  padding: 0;
  border: 0;
  background: none;
  text-align: start;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: var(--size-focus) solid var(--border-focus);
    outline-offset: calc(var(--size-focus) * -1);
  }
`

