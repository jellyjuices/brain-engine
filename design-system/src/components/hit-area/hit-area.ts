import { css } from '@linaria/core'

export const hitArea = css`
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, var(--size-target));
    height: max(100%, var(--size-target));
    translate: -50% -50%;
  }
`
