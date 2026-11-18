import styles from "./field.module.css";
import { XIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { copy } from "@/content/index.ts";

export interface PickFieldProps {
  label: string;
  value?: string;
  placeholder: string;
  icon: PhosphorIcon;
  onPick: () => void;
  onClear?: () => void;
}

export function PickField({ label, value, placeholder, icon, onPick, onClear }: PickFieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.pick}>
        <button
          className={clsx(styles.input, styles.pickButton, !value && styles.isEmpty)}
          type="button"
          onClick={onPick}
        >
          <Icon icon={icon} />
          <span>{value || placeholder}</span>
        </button>
        {value && onClear && (
          <button
            className={styles.searchClear}
            type="button"
            aria-label={copy.common.clear}
            onClick={onClear}
          >
            <Icon icon={XIcon} />
          </button>
        )}
      </div>
    </div>
  );
}
