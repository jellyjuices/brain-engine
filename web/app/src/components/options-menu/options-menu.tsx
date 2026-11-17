import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, CaretRightIcon, CheckIcon } from "@phosphor-icons/react";
import { IconButton } from "../icon-button/icon-button.tsx";
import { Sheet } from "../sheet-next/sheet.tsx";
import type { Option } from "./types.ts";
import { useHeight } from "./use-height.ts";
import * as styles from "./options-menu.styles.ts";

export type { Option } from "./types.ts";

export type OptionsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Option[];
  backLabel?: string;
};

export const OptionsMenu = ({
  open,
  onOpenChange,
  title,
  options,
  backLabel = "Back",
}: OptionsMenuProps) => {
  const [path, setPath] = useState<Option[]>([]);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const { inner, height } = useHeight();
  const list = useRef<HTMLUListElement>(null);
  const current = path.at(-1);
  const items = current?.options ?? options;

  useEffect(() => {
    if (!open) setPath([]);
  }, [open]);

  useEffect(() => {
    if (path.length || direction === "back")
      list.current?.querySelector<HTMLElement>("button")?.focus();
  }, [path, direction]);

  const go = (option: Option) => {
    if (option.options) {
      setDirection("forward");
      setPath((p) => [...p, option]);
      return;
    }
    option.onSelect?.();
    onOpenChange(false);
  };

  const back = () => {
    setDirection("back");
    setPath((p) => p.slice(0, -1));
  };

  const header = (
    <div className={styles.head}>
      {current && <IconButton icon={ArrowLeftIcon} label={backLabel} size="sm" onClick={back} />}
      <span className={styles.title} aria-hidden>
        {current?.label ?? title}
      </span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={current?.label ?? title} header={header}>
      <div className={styles.frame} style={{ height }}>
        <div ref={inner}>
          <ul
            key={path.map((p) => p.id).join("/") || "root"}
            ref={list}
            className={clsx(styles.list, styles.directions[direction])}
            onKeyDown={(e) => e.key === "Backspace" && current && back()}
          >
            {items.map((option) => {
              const Glyph = option.icon;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    className={clsx(styles.item, option.tone === "danger" && styles.isDanger)}
                    aria-pressed={option.selected === undefined ? undefined : option.selected}
                    aria-haspopup={option.options ? "true" : undefined}
                    onClick={() => go(option)}
                  >
                    {Glyph && <Glyph aria-hidden className={styles.icon} />}
                    <span className={styles.label}>{option.label}</span>
                    {option.hint && <span className={styles.hint}>{option.hint}</span>}
                    {option.selected && (
                      <CheckIcon aria-hidden weight="bold" className={styles.check} />
                    )}
                    {option.options && <CaretRightIcon aria-hidden className={styles.caret} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Sheet>
  );
};
