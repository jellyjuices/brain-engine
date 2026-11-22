import styles from "./add-toolbar.module.css";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Icon } from "@/components/icon/icon.tsx";
import { KindIcon } from "@/components/kind-icon/kind-icon.tsx";

export function AddToolbarButton({
  icon,
  label,
  pressed = false,
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
      onClick={onClick}
    >
      {pressed ? (
        <KindIcon name="other" icon={icon} variant="secondary" />
      ) : (
        <span className={styles.inverseGhost}>
          <Icon icon={icon} />
        </span>
      )}
    </button>
  );
}
