import styles from "./bar.module.css";
import clsx from "clsx";
import { Progress } from "radix-ui";
import { mixGradient } from "@/lib/design/area-mix.ts";
import { percentOf } from "@/lib/design/percent.ts";

export type BarProps = {
  label: string;
  done: number;
  total: number;
  countLabel?: string;
  gain?: number;
  gainLabel?: string;
  areas?: string[];
  size?: "goal" | "step";
  showLabel?: boolean;
};

export const Bar = ({
  label: text,
  done,
  total,
  countLabel,
  gain,
  gainLabel,
  areas,
  size = "goal",
  showLabel = true,
}: BarProps) => {
  const percent = percentOf(done, total);
  const fill = areas?.length ? { background: mixGradient(areas, "fill", 90) } : {};
  return (
    <div className={clsx(styles.bar, size === "step" && styles.step)}>
      {size === "goal" && (
        <div className={styles.head}>
          {showLabel && <p className={styles.label}>{text}</p>}
          <p className={styles.number} aria-hidden>
            {percent}
            <span className={styles.unit}>%</span>
          </p>
          {(countLabel || gain !== undefined) && (
            <p className={styles.facts}>
              {countLabel && <span>{countLabel}</span>}
              {gain !== undefined && gain > 0 && (
                <span className={styles.gainText}>
                  <span className={styles.gainNumber}>+{gain}</span> {gainLabel}
                </span>
              )}
            </p>
          )}
        </div>
      )}
      <Progress.Root
        className={styles.track}
        value={percent}
        aria-label={text}
        getValueLabel={(value) => `${value}%`}
      >
        <Progress.Indicator className={styles.fillBar} style={{ width: `${percent}%`, ...fill }} />
      </Progress.Root>
    </div>
  );
};
