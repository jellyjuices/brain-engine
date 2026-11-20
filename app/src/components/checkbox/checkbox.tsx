import clsx from "clsx";
import { Checkbox as RadixCheckbox } from "radix-ui";
import { CheckIcon } from "@phosphor-icons/react";
import hit from "../hit-area/hit-area.module.css";
import styles from "./checkbox.module.css";

export interface CheckboxProps {
  checked?: boolean;
  shape?: "round" | "square";
  label?: string;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({
  checked,
  shape = "round",
  label,
  disabled,
  onCheckedChange,
}: CheckboxProps) {
  const className = clsx(styles.check, styles[shape], disabled && styles.isDisabled);
  if (!onCheckedChange)
    return (
      <span className={className} data-state={checked ? "checked" : "unchecked"} aria-hidden>
        {checked && <CheckIcon className={styles.mark} weight="bold" />}
      </span>
    );
  return (
    <RadixCheckbox.Root
      className={clsx(className, hit.area)}
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onCheckedChange={(value) => onCheckedChange(value === true)}
    >
      <RadixCheckbox.Indicator className={styles.mark}>
        <CheckIcon weight="bold" aria-hidden />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
