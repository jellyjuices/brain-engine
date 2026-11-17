import clsx from "clsx";
import type { Icon } from "@phosphor-icons/react";
import {
  CalendarBlankIcon,
  CalendarXIcon,
  CircleDashedIcon,
  HourglassMediumIcon,
} from "@phosphor-icons/react";
import type { WhenStatus } from "@/lib/design/when.ts";
import visually from "../visually-hidden/visually-hidden.module.css";
import styles from "./when-chip.module.css";

export type WhenChipProps = {
  label: string;
  status: WhenStatus;
  statusLabel?: string;
};

const glyphs: Record<WhenStatus, Icon> = {
  overdue: CalendarXIcon,
  waiting: HourglassMediumIcon,
  today: CalendarBlankIcon,
  due: CalendarBlankIcon,
  someday: CircleDashedIcon,
};

export function WhenChip({ label, status, statusLabel }: WhenChipProps) {
  const Glyph = glyphs[status];
  return (
    <span className={clsx(styles.whenChip, styles[status])}>
      <Glyph
        aria-hidden
        weight={status === "overdue" ? "bold" : "regular"}
        className={styles.glyph}
      />
      {statusLabel && <span className={visually.hidden}>{statusLabel} </span>}
      {label}
    </span>
  );
}
