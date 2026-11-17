import { css } from '@linaria/core'
import clsx from 'clsx'
import { ArrowBendUpLeftIcon } from '@phosphor-icons/react'
import { AreaMark } from '../area-mark/area-mark.tsx'

const timelineLine = css`
  position: relative;
  display: grid;
  gap: var(--space-2xs);
  min-height: var(--size-target);
  padding: var(--space-sm) var(--space-lg);
  list-style: none;

  & + & {
    border-top: var(--size-hair) solid var(--border-primary);
  }
`

const isLink = css`
  .${timelineLine}&:active {
    background: var(--background-pressed);
  }

  @media (hover: hover) {
    .${timelineLine}&:hover {
      background: var(--background-hover);
    }
  }
`

const meta = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 var(--space-xs);
  margin: 0;
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
`

const about = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
`

const glyph = css`
  width: var(--font-size-body-sm);
  height: var(--font-size-body-sm);
`

const text = css`
  margin: 0;
  font-size: var(--font-size-body-sm);
  line-height: var(--font-leading-normal);
  color: var(--text-primary);
`

const open = css`
  padding: 0;
  border: 0;
  background: none;
  text-align: start;
  cursor: pointer;

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

const beforeText = css`
  margin: 0;
  font-size: var(--font-size-body-xs);
  color: var(--text-secondary);
`

export type TimelineLineProps = {
  date: string
  dateLabel: string
  kind: string
  text: string
  about?: string
  areas?: string[]
  quote?: boolean
  before?: string
  from?: string
  onOpen?: () => void
}

export const TimelineLine = (props: TimelineLineProps) => {
  const { date, dateLabel, kind, areas, quote, before, from, onOpen } = props
  const body = quote ? `“${props.text}”` : props.text
  return (
    <li className={clsx(timelineLine, onOpen && isLink)}>
      <p className={meta}>
        <time dateTime={date}>{dateLabel}</time>
        <span aria-hidden> · </span>
        <span>{kind}</span>
        {props.about && (
          <>
            <span aria-hidden> · </span>
            <span className={about}>
              {areas && <AreaMark areas={areas} />}
              {props.about}
            </span>
          </>
        )}
        {from && (
          <>
            <span aria-hidden> · </span>
            <span className={about}>
              <ArrowBendUpLeftIcon aria-hidden className={glyph} />
              {from}
            </span>
          </>
        )}
      </p>
      {onOpen ? (
        <button type="button" className={clsx(text, open)} onClick={onOpen}>
          {body}
        </button>
      ) : (
        <p className={text}>{body}</p>
      )}
      {before && <p className={beforeText}>{before}</p>}
    </li>
  )
}
