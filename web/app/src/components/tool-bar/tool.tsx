import { css } from "@linaria/core";
import { Icon } from "@/components/icon/icon.tsx";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

const tool = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  min-width: 0;
  min-height: var(--size-target);
  padding: var(--space-xs) 0;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  transition: color var(--motion-fast) var(--motion-easing);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
    color: var(--text-accent);
  }

  &:hover {
    color: var(--text-primary);
  }

  &:active {
    background: var(--background-accent-soft);
  }

  @media (hover: none) {
    &:hover {
      color: var(--text-secondary);
    }
  }
`;

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
    <button className={tool} type="button" onClick={onClick}>
      <Icon icon={icon} />
      <span>{label}</span>
    </button>
  );
}
