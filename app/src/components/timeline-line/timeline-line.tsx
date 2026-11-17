import styles from "./timeline-line.module.css";
import clsx from "clsx";
import { ArrowBendUpLeftIcon } from "@phosphor-icons/react";
import { AreaMark } from "../area-mark/area-mark.tsx";

export type TimelineLineProps = {
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

export const TimelineLine = (props: TimelineLineProps) => {
  const { date, dateLabel, kind, areas, quote, before, from, onOpen } = props;
  const body = quote ? `“${props.text}”` : props.text;
  return (
    <div className={clsx(styles.timelineLine, onOpen && styles.isLink)}>
      <p className={styles.meta}>
        <time dateTime={date}>{dateLabel}</time>
        <span aria-hidden> · </span>
        <span>{kind}</span>
        {props.about && (
          <>
            <span aria-hidden> · </span>
            <span className={styles.about}>
              {areas && <AreaMark areas={areas} />}
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
