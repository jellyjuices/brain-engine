import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/icon-button/icon-button.tsx";
import { copy } from "@/content/index.ts";
import styles from "./sheet-head.module.css";

export interface SheetHeadProps {
  title: string;
  context?: ReactNode;
  quote?: string;
  onBack?: () => void;
}

export function SheetHead({ title, context, quote, onBack }: SheetHeadProps) {
  return (
    <div className={styles.head}>
      {(onBack || context) && (
        <div className={styles.context}>
          {onBack && (
            <IconButton
              icon={ArrowLeftIcon}
              label={copy.common.back}
              className={styles.back}
              onClick={onBack}
            />
          )}
          {context}
        </div>
      )}
      <h2 className={styles.title}>{title}</h2>
      {quote && <p className={styles.quote}>{quote}</p>}
    </div>
  );
}
