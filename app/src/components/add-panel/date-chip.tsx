import styles from "./date-chip.module.css";
import { CalendarDotsIcon } from "@phosphor-icons/react";
import { Chip } from "@/components/chip/chip.tsx";
import { longDate } from "@/lib/notes/model.ts";

export function DateChip({ date, onRemove }: { date: string; onRemove: () => void }) {
  return (
    <div className={styles.dateChip}>
      <Chip label={longDate(date)} variant="accent" icon={CalendarDotsIcon} onRemove={onRemove} />
    </div>
  );
}
