import clsx from "clsx";
import { useId, useState, type KeyboardEvent } from "react";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import visually from "../visually-hidden/visually-hidden.module.css";
import styles from "./suggest-input.module.css";

export type Suggestion = { id: string; label: string; hint?: string };

export type SuggestInputProps = {
  label: string;
  placeholder?: string;
  suggestions: Suggestion[];
  onPick?: (item: Suggestion) => void;
  disabled?: boolean;
  hideLabel?: boolean;
};

export const SuggestInput = ({
  label,
  placeholder,
  suggestions,
  onPick,
  disabled,
  hideLabel,
}: SuggestInputProps) => {
  const id = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const query = value.trim().toLowerCase();
  const items = query
    ? suggestions.filter((s) => s.label.toLowerCase().includes(query))
    : suggestions;
  const shown = open && items.length > 0;

  const pick = (item: Suggestion) => {
    setValue(item.label);
    setOpen(false);
    onPick?.(item);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + items.length) % Math.max(items.length, 1));
    } else if (e.key === "Enter" && shown) {
      e.preventDefault();
      const item = items[active];
      if (item) pick(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className={clsx(styles.suggestInput, disabled && styles.isDisabled)}>
      <label htmlFor={id} className={clsx(styles.label, hideLabel && visually.hidden)}>
        {label}
      </label>
      <div className={styles.field}>
        <MagnifyingGlassIcon aria-hidden className={styles.icon} />
        <input
          id={id}
          className={styles.control}
          role="combobox"
          aria-expanded={shown}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={shown ? `${id}-${active}` : undefined}
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      <ul
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        className={styles.list}
        hidden={!shown}
      >
        {items.map((item, i) => (
          <li
            key={item.id}
            id={`${id}-${i}`}
            role="option"
            aria-selected={i === active}
            className={clsx(styles.option, i === active && styles.isActive)}
            onMouseDown={(e) => e.preventDefault()}
            onMouseEnter={() => setActive(i)}
            onClick={() => pick(item)}
          >
            <span>{item.label}</span>
            {item.hint && <span className={styles.hint}>{item.hint}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};
