import { css } from '@linaria/core'
import { meta } from './todo-row-meta.styles.ts'
import { content, row, tick, title } from './todo-row.styles.ts'

export const isDragging = css`
  .${row}& .${content} {
    transition: none;
    user-select: none;
  }
`

export const isDone = css`
  .${row}& .${title} {
    color: var(--text-secondary);
    text-decoration: line-through;
  }
`

export const isDisabled = css`
  .${row}& .${content} {
    background: var(--background-primary);
  }

  .${row}& .${tick} {
    border-style: dashed;
    border-color: var(--text-disabled);
    background: var(--background-disabled);
    cursor: not-allowed;
  }

  .${row}& .${title},
  .${row}& .${meta} {
    color: var(--text-disabled);
    cursor: not-allowed;
  }
`

export const isPressed = css`
  .${row}& .${content} {
    background:
      linear-gradient(var(--background-pressed), var(--background-pressed)),
      var(--background-primary);
  }
`
