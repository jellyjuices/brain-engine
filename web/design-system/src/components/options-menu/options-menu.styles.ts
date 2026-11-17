import { css } from '@linaria/core'

export const head = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--size-control);
`

export const title = css`
  font-family: var(--font-display);
  font-size: var(--font-size-display-md);
`

export const frame = css`
  overflow: hidden;
  transition: height var(--motion-slow) var(--motion-easing);
`

export const list = css`
  margin: 0;
  padding: var(--space-xs) 0;
  list-style: none;

  @keyframes options-menu-from-right {
    from {
      opacity: 0;
      transform: translateX(var(--space-2xl));
    }
  }

  @keyframes options-menu-from-left {
    from {
      opacity: 0;
      transform: translateX(calc(var(--space-2xl) * -1));
    }
  }
`

export const directions = {
  forward: css`
    .${list}& {
      animation: options-menu-from-right var(--motion-slow) var(--motion-easing);
    }
  `,
  back: css`
    .${list}& {
      animation: options-menu-from-left var(--motion-slow) var(--motion-easing);
    }
  `,
}

export const icon = css`
  flex: none;
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  color: var(--text-secondary);
`

export const check = css`
  flex: none;
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  color: var(--text-accent);
`

export const caret = css`
  flex: none;
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  color: var(--text-secondary);
`

export const item = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  min-height: var(--size-control);
  padding: 0 var(--space-md);
  border: 0;
  border-radius: var(--radius-input);
  background: none;
  text-align: left;
  cursor: pointer;

  &:active {
    background: var(--background-pressed);
  }

  @media (hover: hover) {
    &:hover {
      background: var(--background-hover);
    }
  }
`

export const isDanger = css`
  .${item}& {
    color: var(--text-danger);
  }

  .${item}& .${icon} {
    color: inherit;
  }
`

export const label = css`
  flex: 1;
`

export const hint = css`
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`
