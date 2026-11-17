import "./tool-bar.css";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

export function Tool({
  icon,
  label,
  onClick,
}: {
  icon: PhosphorIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="tool" type="button" onClick={onClick}>
      <Icon icon={icon} />
      <span>{label}</span>
    </button>
  );
}
