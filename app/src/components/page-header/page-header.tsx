import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { mixGlow } from "@/lib/design/area-mix.ts";
import { back } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";
import { IconButton } from "../icon-button/icon-button.tsx";
import styles from "./page-header.module.css";

export type PageHeaderProps = {
  title?: string;
  kicker?: string;
  action?: ReactNode;
  glow?: boolean;
  wrap?: boolean;
  children?: ReactNode;
  areas?: string[];
  fallback?: string;
  onBack?: () => void;
  backLabel?: string;
};

export function PageHeader({
  title,
  kicker,
  action,
  glow = true,
  wrap = false,
  children,
  areas,
  fallback,
  onBack,
  backLabel = copy.common.back,
}: PageHeaderProps) {
  const hasBack = !!onBack || fallback !== undefined;
  return (
    <header
      className={clsx(styles.pageHeader, glow && styles.glow, wrap && styles.wrap)}
      style={areas?.length ? ({ "--page-glow": mixGlow(areas) } as CSSProperties) : undefined}
    >
      <div className={styles.top}>
        {hasBack && (
          <IconButton
            icon={ArrowLeftIcon}
            label={backLabel}
            className={styles.back}
            onClick={onBack ?? (() => back(fallback))}
          />
        )}
        <div className={styles.main}>
          {kicker && <p className={styles.kicker}>{kicker}</p>}
          {title && <h1 className={styles.title}>{title}</h1>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {children}
    </header>
  );
}
