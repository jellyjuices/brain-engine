import clsx from "clsx";
import type { KeyboardEvent } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { IconButton } from "../icon-button/icon-button.tsx";
import { Sheet } from "../sheet/sheet.tsx";
import { OptionItem } from "./option-item.tsx";
import type { Option } from "./types.ts";
import { useHeight } from "./use-height.ts";
import { useMenuPath } from "./use-menu-path.ts";
import styles from "./options-menu.module.css";

export type { Option } from "./types.ts";

export type OptionsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  options: Option[];
  backLabel?: string;
};

export function OptionsMenu({
  open,
  onOpenChange,
  title,
  options,
  backLabel = "Back",
}: OptionsMenuProps) {
  const { path, direction, list, current, pick, back } = useMenuPath(open, onOpenChange);
  const { inner, height } = useHeight();
  const heading = current?.label ?? title;

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Backspace" && current) back();
  }

  const header = (
    <div className={styles.head}>
      {current && <IconButton icon={ArrowLeftIcon} label={backLabel} size="sm" onClick={back} />}
      <span className={styles.title} aria-hidden>
        {heading}
      </span>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={heading} header={header}>
      <div className={styles.frame} style={{ height }}>
        <div ref={inner}>
          <ul
            key={path.map((p) => p.id).join("/") || "root"}
            ref={list}
            className={clsx(styles.list, styles[direction])}
            onKeyDown={onKeyDown}
          >
            {(current?.options ?? options).map((option) => (
              <li key={option.id}>
                <OptionItem option={option} onPick={pick} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  );
}
