import { CaretRightIcon, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";

export interface OptionProps {
  icon: PhosphorIcon;
  label: string;
  description?: string;
  tone?: "primary" | "danger";
  chevron?: boolean;
  autoFocus?: boolean;
  onClick: () => void;
}

export function Option({
  icon,
  label,
  description,
  tone,
  chevron,
  autoFocus,
  onClick,
}: OptionProps) {
  return (
    <button
      className={clsx("option", tone && `option--${tone}`)}
      type="button"
      autoFocus={autoFocus}
      onClick={onClick}
    >
      <span className="option-icon">
        <Icon icon={icon} />
      </span>
      <span className="option-main">
        <span className="option-label">{label}</span>
        {description && <span className="option-desc">{description}</span>}
      </span>
      {chevron && <Icon icon={CaretRightIcon} />}
    </button>
  );
}
