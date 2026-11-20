import styles from "./toolbar.module.css";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: PhosphorIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={styles.tool} type="button" onClick={onClick}>
      <Icon icon={icon} />
      <span>{label}</span>
    </button>
  );
}
