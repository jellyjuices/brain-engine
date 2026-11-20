import clsx from "clsx";
import { CaretRightIcon, CheckIcon } from "@phosphor-icons/react";
import type { Option } from "./types.ts";
import styles from "./options-menu.module.css";

type OptionItemProps = {
  option: Option;
  onPick: (option: Option) => void;
};

export function OptionItem({ option, onPick }: OptionItemProps) {
  const Glyph = option.icon;
  return (
    <button
      type="button"
      className={clsx(styles.item, option.tone === "danger" && styles.isDanger)}
      aria-pressed={option.selected}
      aria-haspopup={option.options ? "true" : undefined}
      onClick={() => onPick(option)}
    >
      {Glyph && <Glyph aria-hidden className={styles.icon} />}
      <span className={styles.label}>{option.label}</span>
      {option.hint && <span className={styles.hint}>{option.hint}</span>}
      {option.selected && <CheckIcon aria-hidden weight="bold" className={styles.check} />}
      {option.options && <CaretRightIcon aria-hidden className={styles.caret} />}
    </button>
  );
}
