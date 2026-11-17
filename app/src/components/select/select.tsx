import styles from "./select.module.css";
import { useId } from "react";
import { Select as RadixSelect } from "radix-ui";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

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
    <div className={styles.select}>
      <label htmlFor={id} className={styles.labelText}>
        {label}
      </label>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger id={id} className={styles.trigger}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className={styles.caret}>
            <CaretDownIcon aria-hidden />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={styles.content} position="popper" sideOffset={6}>
            <RadixSelect.Viewport className={styles.viewport}>
              {items.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className={styles.item}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={styles.check}>
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
