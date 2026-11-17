import clsx from "clsx";
import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { IconButton } from "../icon-button/icon-button.tsx";
import visually from "../visually-hidden/visually-hidden.module.css";
import { useDragClose } from "./use-drag-close.ts";
import styles from "./sheet.module.css";

export type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  hideTitle?: boolean;
  description?: string;
  header?: ReactNode;
  closeLabel?: string;
  children: ReactNode;
};

export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  header,
  closeLabel,
  children,
}: SheetProps) {
  const drag = useDragClose(() => onOpenChange(false));
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) drag.reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.scrim} />
        <Dialog.Content
          className={clsx(styles.sheet, drag.dragging && styles.isDragging)}
          style={{ transform: drag.offset ? `translateY(${drag.offset}px)` : undefined }}
          onAnimationEnd={drag.reset}
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className={styles.grip} {...drag.handlers}>
            <span className={styles.handle} aria-hidden />
          </div>
          <div className={styles.head} {...drag.handlers}>
            {header ?? (
              <Dialog.Title className={clsx(styles.title, hideTitle && visually.hidden)}>
                {title}
              </Dialog.Title>
            )}
            {header && <Dialog.Title className={visually.hidden}>{title}</Dialog.Title>}
            {closeLabel && (
              <Dialog.Close asChild>
                <IconButton icon={XIcon} label={closeLabel} className={styles.close} />
              </Dialog.Close>
            )}
          </div>
          {description && (
            <Dialog.Description className={styles.description}>{description}</Dialog.Description>
          )}
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
