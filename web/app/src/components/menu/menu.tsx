import { css } from "@linaria/core";
import clsx from "clsx";
import { DropdownMenu } from "radix-ui";
import { DotsThreeIcon, type Icon } from "@phosphor-icons/react";
import { IconButton } from "../icon-button/icon-button.tsx";

const menu = css`
  z-index: 20;
  min-width: var(--size-menu-min);
  padding: var(--space-xs);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-input);
  background: var(--background-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-raised);
  animation: menu-in var(--motion-fast) var(--motion-easing);

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-xs) * -1));
    }
  }
`;

const icon = css`
  width: var(--size-icon-sm);
  height: var(--size-icon-sm);
  color: var(--text-secondary);
`;

const item = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: var(--size-control);
  padding: 0 var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  outline: none;
  user-select: none;

  &[data-highlighted] {
    background: var(--background-hover);
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 var(--size-focus) var(--border-focus);
  }
`;

const isDanger = css`
  .${item}& {
    color: var(--text-danger);
  }

  .${item}& .${icon} {
    color: inherit;
  }
`;

const isDisabled = css`
  .${item}& {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  .${item}& .${icon} {
    color: inherit;
  }
`;

const separator = css`
  height: var(--size-hair);
  margin: var(--space-xs) 0;
  background: var(--border-primary);
`;

export type MenuItem = {
  id: string;
  label: string;
  icon?: Icon;
  tone?: "danger";
  disabled?: boolean;
  onSelect?: () => void;
};

export type MenuProps = {
  label: string;
  groups: MenuItem[][];
  triggerIcon?: Icon;
};

export const Menu = ({ label, groups, triggerIcon = DotsThreeIcon }: MenuProps) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <IconButton icon={triggerIcon} label={label} />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={menu} align="end" sideOffset={6}>
        {groups.map((group, i) => (
          <DropdownMenu.Group key={i}>
            {i > 0 && <DropdownMenu.Separator className={separator} />}
            {group.map(({ id, label: text, icon: Glyph, tone, disabled, onSelect }) => (
              <DropdownMenu.Item
                key={id}
                className={clsx(item, tone === "danger" && isDanger, disabled && isDisabled)}
                disabled={disabled}
                onSelect={onSelect}
              >
                {Glyph && <Glyph aria-hidden className={icon} />}
                {text}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Group>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);
