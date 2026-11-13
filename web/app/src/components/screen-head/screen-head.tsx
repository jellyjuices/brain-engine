import "./screen-head.css";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { IconButton } from "@/components/button/icon-button.tsx";
import { back } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

export interface ScreenHeadProps {
  title?: string;
  kicker?: string;
  fallback?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
}

export function ScreenHead({
  title,
  kicker,
  fallback,
  onBack,
  backLabel = copy.common.back,
  action,
}: ScreenHeadProps) {
  const hasBack = !!onBack || fallback !== undefined;
  return (
    <header className={clsx("screen-head", hasBack && "has-back")}>
      {hasBack && (
        <IconButton
          icon={CaretLeftIcon}
          label={backLabel}
          onClick={onBack ?? (() => back(fallback))}
        />
      )}
      <div className="screen-head-main">
        {kicker && <span className="screen-kicker">{kicker}</span>}
        {title && <h1 className="screen-title serif">{title}</h1>}
      </div>
      {action && <div className="screen-head-action">{action}</div>}
    </header>
  );
}
