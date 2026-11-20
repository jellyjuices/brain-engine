import styles from "./timeline-entry.module.css";
import clsx from "clsx";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import { AreaIndicator } from "../area-indicator/area-indicator.tsx";

export type TimelineEntryProps = {
  date: string;
  dateLabel: string;
  kind: string;
  text: string;
  about?: string;
  areas?: string[];
  quote?: boolean;
  before?: string;
  from?: string;
  onOpen?: () => void;
};

export const TimelineEntry = (props: TimelineEntryProps) => {
  const { date, dateLabel, kind, areas, quote, before, from, onOpen } = props;
  const body = quote ? `“${props.text}”` : props.text;
  return (
    <div className={clsx(styles.timelineEntry, onOpen && styles.isLink)}>
      <p className={styles.meta}>
        <time dateTime={date}>{dateLabel}</time>
        <span aria-hidden> · </span>
        <span>{kind}</span>
        {props.about && (
          <>
            <span aria-hidden> · </span>
            <span className={styles.about}>
              {areas && <AreaIndicator areas={areas} />}
              {props.about}
            </span>
          </>
        )}
        {from && (
          <>
            <span aria-hidden> · </span>
            <span className={styles.about}>
              <ArrowBendUpLeftIcon aria-hidden className={styles.glyph} />
              {from}
            </span>
          </>
        )}
      </p>
      {onOpen ? (
        <button type="button" className={clsx(styles.text, styles.open)} onClick={onOpen}>
          {body}
        </button>
      ) : (
        <p className={styles.text}>{body}</p>
      )}
      {before && <p className={styles.beforeText}>{before}</p>}
    </div>
  );
};
