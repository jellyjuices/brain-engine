import { css } from '@linaria/core'

export const meta = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-xs) var(--space-md);
  margin-top: var(--space-xs);
  font-size: var(--font-size-body-xs);
  color: var(--text-secondary);
`

export const extra = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  min-width: 0;
  line-height: var(--font-leading-snug);
`

export const extraGlyph = css`
  flex: none;
  width: var(--font-size-body-sm);
  height: var(--font-size-body-sm);
`
