import "./button.css";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export interface IconButtonProps {
  icon: PhosphorIcon;
  label: string;
  pressed?: boolean;
  onClick: () => void;
}

export function IconButton({ icon, label, pressed, onClick }: IconButtonProps) {
  return (
    <button
      className="icon-btn"
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon icon={icon} />
    </button>
  );
}
