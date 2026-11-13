import type { Icon } from '@phosphor-icons/react'

export type Option = {
  id: string
  label: string
  icon?: Icon
  hint?: string
  selected?: boolean
  tone?: 'danger'
  options?: Option[]
  onSelect?: () => void
}
