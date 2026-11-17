import { css } from '@linaria/core'

export const visuallyHidden = css`
  position: absolute;
  width: var(--size-hair);
  height: var(--size-hair);
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`
