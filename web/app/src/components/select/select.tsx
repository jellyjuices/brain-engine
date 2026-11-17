import { css } from "@linaria/core";
import { useId } from "react";
import { Select as RadixSelect } from "radix-ui";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

const select = css`
  display: grid;
  gap: var(--space-xs);
`;

const labelText = css`
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
`;

const caret = css`
  display: grid;
  color: var(--text-secondary);
  transition: rotate var(--motion-fast) var(--motion-easing);
`;

const trigger = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  height: var(--size-control);
  padding: 0 var(--space-md);
  border: var(--size-hair) solid var(--border-strong);
  border-radius: var(--radius-input);
  background: var(--background-secondary);
  cursor: pointer;

  &[data-state="open"] {
    border-color: var(--border-focus);
  }

  &[data-placeholder] {
    color: var(--text-secondary);
  }

  &:disabled {
    border-style: dashed;
    border-color: var(--border-primary);
    background: var(--background-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  &[data-state="open"] .${caret} {
    rotate: 180deg;
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      background:
        linear-gradient(var(--background-hover), var(--background-hover)),
        var(--background-secondary);
    }
  }
`;

const content = css`
  z-index: 20;
  width: var(--radix-select-trigger-width);
  max-height: var(--radix-select-content-available-height);
  overflow: hidden;
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-input);
  background: var(--background-raised);
  color: var(--text-primary);
  box-shadow: var(--shadow-raised);
  animation: select-in var(--motion-fast) var(--motion-easing);

  @keyframes select-in {
    from {
      opacity: 0;
      transform: translateY(calc(var(--space-xs) * -1));
    }
  }
`;

const viewport = css`
  padding: var(--space-xs);
`;

const item = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--size-control);
  padding: 0 var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  outline: none;
  user-select: none;

  &[data-highlighted] {
    background: var(--background-hover);
  }

  &[data-state="checked"] {
    color: var(--text-accent);
    font-weight: var(--font-weight-semibold);
  }

  &[data-disabled] {
    color: var(--text-disabled);
    cursor: not-allowed;
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 var(--size-focus) var(--border-focus);
  }
`;

const check = css`
  display: grid;
`;

export type SelectItem = { value: string; label: string; disabled?: boolean };

export type SelectProps = {
  label: string;
  items: SelectItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const Select = ({
  label,
  items,
  value,
  onValueChange,
  placeholder,
  disabled,
}: SelectProps) => {
  const id = useId();
  return (
    <div className={select}>
      <label htmlFor={id} className={labelText}>
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger id={id} className={trigger}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className={caret}>
            <CaretDownIcon aria-hidden />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={content} position="popper" sideOffset={6}>
            <RadixSelect.Viewport className={viewport}>
              {items.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={item}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={check}>
                    <CheckIcon aria-hidden weight="bold" />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
};
