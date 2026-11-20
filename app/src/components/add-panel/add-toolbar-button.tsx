import styles from "./add-panel.module.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { KindIcon } from "@/components/kind-icon/kind-icon.tsx";

export function AddToolbarButton({
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
      className={styles.addToolbarButton}
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <KindIcon name="other" icon={icon} variant="secondary" />
    </button>
  );
}
