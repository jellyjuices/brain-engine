import styles from "./add-panel.module.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Shape } from "@/components/shape/shape.tsx";

export function AddTool({
  icon,
  label,
  pressed,
  onClick,
}: {
  icon: PhosphorIcon;
  label: string;
  pressed?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.addTool}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Shape name="other" icon={icon} variant="secondary" />
    </button>
  );
}
