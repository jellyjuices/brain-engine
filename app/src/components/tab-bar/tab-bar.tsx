import { css } from "@linaria/core";
import clsx from "clsx";
import {
  CheckSquareIcon,
  FoldersIcon,
  MagnifyingGlassIcon,
  MountainsIcon,
  type Icon,
} from "@phosphor-icons/react";
import { PlusButton } from "../plus-button/plus-button.tsx";

const tabBar = css`
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: var(--size-tabbar);
  padding: 0 var(--space-sm);
  border-top: var(--size-hair) solid var(--border-primary);
  background: var(--background-secondary);
`;

const icon = css`
  width: var(--size-icon);
  height: var(--size-icon);
  transition: scale var(--motion-fast) var(--motion-easing);
`;

const item = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  min-width: var(--size-control);
  padding: var(--space-xs) var(--space-sm);
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: color var(--motion-fast) var(--motion-easing);

  &:active .${icon} {
    scale: 0.88;
  }

  @media (prefers-reduced-motion: reduce) {
    &:active .${icon} {
      scale: 1;
    }
  }

  @media (hover: hover) {
    &:hover {
      color: var(--text-primary);
    }
  }
`;

const isActive = css`
  color: var(--text-accent);
`;

export type TabId = "todos" | "goals" | "find" | "brain";

type Tab = { id: TabId; label: string; icon: Icon; activeWeight?: "fill" | "bold" };

const left: Tab[] = [
  { id: "todos", label: "To-dos", icon: CheckSquareIcon },
  { id: "goals", label: "Goals", icon: MountainsIcon },
];
const right: Tab[] = [
  { id: "find", label: "Find", icon: MagnifyingGlassIcon, activeWeight: "bold" },
  { id: "brain", label: "Brain", icon: FoldersIcon },
];

export type TabBarProps = {
  active: TabId;
  onSelect: (id: TabId) => void;
  onAdd: () => void;
  addLabel?: string;
};

export const TabBar = ({ active, onSelect, onAdd, addLabel = "Add" }: TabBarProps) => {
  const tab = ({ id, label, icon: Glyph, activeWeight = "fill" }: Tab) => (
    <button
      key={id}
      type="button"
      className={clsx(item, id === active && isActive)}
      aria-current={id === active ? "page" : undefined}
      onClick={() => onSelect(id)}
    >
      <Glyph weight={id === active ? activeWeight : "regular"} aria-hidden className={icon} />
      {label}
    </button>
  );
  return (
    <nav className={tabBar} aria-label="Main">
      {left.map(tab)}
      <PlusButton label={addLabel} onClick={onAdd} raised />
      {right.map(tab)}
    </nav>
  );
};
