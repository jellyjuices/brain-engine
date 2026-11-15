import * as s from "./sheet.styles.ts";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { IconButton } from "@ds/components/icon-button/icon-button.tsx";
import { copy } from "@/content/index.ts";

export interface SheetHeadProps {
  title: string;
  context?: ReactNode;
  quote?: string;
  onBack?: () => void;
}

export function SheetHead({ title, context, quote, onBack }: SheetHeadProps) {
  return (
    <div className={s.head}>
      {(onBack || context) && (
        <div className={s.context}>
          {onBack && <IconButton icon={CaretLeftIcon} label={copy.common.back} onClick={onBack} />}
          {context}
        </div>
      )}
      <h2 className={clsx("serif", s.title)}>{title}</h2>
      {quote && <p className={s.quote}>{quote}</p>}
    </div>
  );
}
