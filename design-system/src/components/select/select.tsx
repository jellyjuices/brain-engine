import { useId } from 'react'
import { Select as RadixSelect } from 'radix-ui'
import { CaretDownIcon, CheckIcon } from '@phosphor-icons/react'
import './select.css'

export type SelectItem = { value: string; label: string; disabled?: boolean }

export type SelectProps = {
  label: string
  items: SelectItem[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export const Select = ({ label, items, value, onValueChange, placeholder, disabled }: SelectProps) => {
  const id = useId()
  return (
    <div className="select">
      <label htmlFor={id} className="select-label">
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger id={id} className="select-trigger">
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="select-caret">
            <CaretDownIcon aria-hidden />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="select-content" position="popper" sideOffset={6}>
            <RadixSelect.Viewport className="select-viewport">
              {items.map((item) => (
                <RadixSelect.Item key={item.value} value={item.value} disabled={item.disabled} className="select-item">
                  <RadixSelect.ItemText>{item.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="select-check">
                    <CheckIcon aria-hidden weight="bold" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  )
}
