import clsx from 'clsx'
import { DropdownMenu } from 'radix-ui'
import { DotsThreeIcon, type Icon } from '@phosphor-icons/react'
import { IconButton } from '../icon-button/icon-button.tsx'
import './menu.css'

export type MenuItem = { id: string; label: string; icon?: Icon; tone?: 'danger'; disabled?: boolean; onSelect?: () => void }

export type MenuProps = {
  label: string
  groups: MenuItem[][]
  triggerIcon?: Icon
}

export const Menu = ({ label, groups, triggerIcon = DotsThreeIcon }: MenuProps) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <IconButton icon={triggerIcon} label={label} />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content className="menu" align="end" sideOffset={6}>
        {groups.map((group, i) => (
          <DropdownMenu.Group key={i}>
            {i > 0 && <DropdownMenu.Separator className="menu-separator" />}
            {group.map(({ id, label: text, icon: Glyph, tone, disabled, onSelect }) => (
              <DropdownMenu.Item
                key={id}
                className={clsx('menu-item', tone === 'danger' && 'is-danger')}
                disabled={disabled}
                onSelect={onSelect}
              >
                {Glyph && <Glyph aria-hidden className="menu-icon" />}
                {text}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Group>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)
