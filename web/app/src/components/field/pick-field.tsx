import * as s from "./field.styles.ts";
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
    <div className={s.field}>
      <span className="section-label">{label}</span>
      <div className={s.pickBox}>
        <button
          className={clsx(s.input, s.pickButton, !value && s.pickEmpty)}
          type="button"
          onClick={onPick}
        >
          <Icon icon={icon} />
          <span>{value || placeholder}</span>
        </button>
        {value && onClear && (
          <button
            className={s.searchClear}
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
