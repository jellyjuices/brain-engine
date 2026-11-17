import styles from "./add-panel.module.css";
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon } from "@phosphor-icons/react";
import { Shape } from "@/components/shape/shape.tsx";
import { copy } from "@/content/index.ts";

export function AddFull({ full, onToggle }: { full: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.addFull}
      aria-label={full ? copy.add.smaller : copy.add.fullScreen}
      aria-pressed={full}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onToggle}
    >
      <Shape
        name="other"
        icon={full ? ArrowsInSimpleIcon : ArrowsOutSimpleIcon}
        variant="secondary"
      />
    </button>
  );
}
