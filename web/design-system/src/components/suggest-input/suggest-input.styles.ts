import { css } from '@linaria/core'

export const label = css`
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
`

export const icon = css`
  flex: none;
  width: var(--size-icon);
  height: var(--size-icon);
  color: var(--text-secondary);
`

export const control = css`
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: none;
  font-size: var(--font-size-body-md);
  outline: none;

  &::placeholder {
    color: var(--text-secondary);
  }
`

export const field = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: var(--size-control);
  padding: 0 var(--space-md);
  border: var(--size-hair) solid var(--border-strong);
  border-radius: var(--radius-input);
  background: var(--background-secondary);
  transition: border-color var(--motion-fast) var(--motion-easing);

  &:focus-within {
    border-color: var(--border-focus);
  }

  &:has(:focus-visible) {
    box-shadow: 0 0 0 var(--size-hair) var(--border-focus);
  }

  @media (hover: hover) {
    &:hover {
      border-color: var(--text-secondary);
    }
  }
`

export const suggestInput = css`
  position: relative;
  display: grid;
  gap: var(--space-xs);
`

export const isDisabled = css`
  .${suggestInput}& .${label},
  .${suggestInput}& .${icon},
  .${suggestInput}& .${control},
  .${suggestInput}& .${control}::placeholder {
    color: var(--text-disabled);
  }

  .${suggestInput}& .${field} {
    border-style: dashed;
    border-color: var(--border-primary);
    background: var(--background-disabled);
    cursor: not-allowed;
  }
`

export const list = css`
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 5;
  margin: var(--space-xs) 0 0;
  padding: var(--space-xs);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-input);
  background: var(--background-secondary);
  box-shadow: var(--shadow-raised);
  list-style: none;
`

export const option = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--size-control);
  line-height: var(--font-leading-snug);
  gap: var(--space-md);
  padding: 0 var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;

  &:active {
    background: var(--background-pressed);
  }
`

export const isActive = css`
  background: var(--background-hover);
`

export const hint = css`
  font-size: var(--font-size-body-xs);
  color: var(--text-secondary);
`
