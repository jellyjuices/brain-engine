import "./sheet.css";
import { XIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { Icon } from "@/components/icon/icon.tsx";
import { copy } from "@/content/index.ts";
import { useSwipeToClose } from "./use-swipe-to-close.ts";

export interface SheetProps {
  title: string;
  leaving: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ title, leaving, onClose, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const [swiped, setSwiped] = useState(false);
  useSwipeToClose(panel, () => {
    setSwiped(true);
    onClose();
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={clsx("sheet-scrim", leaving && "leaving", swiped && "swiped")}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={panel} className="sheet stack" role="dialog" aria-modal="true" aria-label={title}>
        <button
          type="button"
          className="sheet-close"
          aria-label={copy.common.close}
          onClick={onClose}
        >
          <Icon icon={XIcon} />
        </button>
        {children}
      </div>
    </div>
  );
}
