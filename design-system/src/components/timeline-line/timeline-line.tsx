import clsx from 'clsx'
import { ArrowBendUpLeftIcon } from '@phosphor-icons/react'
import { AreaMark } from '../area-mark/area-mark.tsx'
import './timeline-line.css'

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

export const TimelineLine = ({ date, dateLabel, kind, text, about, areas, quote, before, from, onOpen }: TimelineLineProps) => {
  const body = quote ? `“${text}”` : text
  return (
    <li className={clsx('timeline-line', onOpen && 'is-link')}>
      <p className="timeline-line-meta">
        <time dateTime={date}>{dateLabel}</time>
        <span aria-hidden> · </span>
        <span>{kind}</span>
        {about && (
          <>
            <span aria-hidden> · </span>
            <span className="timeline-line-about">
              {areas && <AreaMark areas={areas} />}
              {about}
            </span>
          </>
        )}
        {from && (
          <>
            <span aria-hidden> · </span>
            <span className="timeline-line-about">
              <ArrowBendUpLeftIcon aria-hidden className="timeline-line-glyph" />
              {from}
            </span>
          </>
        )}
      </p>
      {onOpen ? (
        <button type="button" className="timeline-line-text timeline-line-open" onClick={onOpen}>
          {body}
        </button>
      ) : (
        <p className="timeline-line-text">{body}</p>
      )}
      {before && <p className="timeline-line-before">{before}</p>}
    </li>
  )
}
