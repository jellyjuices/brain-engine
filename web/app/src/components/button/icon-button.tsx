import { css } from "@linaria/core";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const iconButton = css`
  display: grid;
  place-items: center;
  width: var(--touch);
  height: var(--touch);
  border: 0;
  border-radius: var(--pill);
  background: transparent;
  color: var(--muted);

  & svg {
    width: var(--icon);
    height: var(--icon);
  }
`;

export interface IconButtonProps {
  icon: PhosphorIcon;
  label: string;
  pressed?: boolean;
  onClick: () => void;
}

export function IconButton({ icon, label, pressed, onClick }: IconButtonProps) {
  return (
    <button
      className={`icon-btn ${iconButton}`}
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <Icon icon={icon} />
    </button>
  );
}
