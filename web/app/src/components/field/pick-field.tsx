import "./field.css";
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
    <div className="field">
      <span className="section-label">{label}</span>
      <div className="pick">
        <button
          className={clsx("input pick-button", !value && "is-empty")}
          type="button"
          onClick={onPick}
        >
          <Icon icon={icon} />
          <span>{value || placeholder}</span>
        </button>
        {value && onClear && (
          <button
            className="search-clear"
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
