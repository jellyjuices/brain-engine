import "./sheet.css";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/button/icon-button.tsx";
import { copy } from "@/content/index.ts";

export interface SheetHeadProps {
  title: string;
  context?: ReactNode;
  quote?: string;
  onBack?: () => void;
}

export function SheetHead({ title, context, quote, onBack }: SheetHeadProps) {
  return (
    <div className="sheet-head">
      {(onBack || context) && (
        <div className="sheet-context">
          {onBack && <IconButton icon={CaretLeftIcon} label={copy.common.back} onClick={onBack} />}
          {context}
        </div>
      )}
      <h2 className="serif sheet-title">{title}</h2>
      {quote && <p className="sheet-quote">{quote}</p>}
    </div>
  );
}
