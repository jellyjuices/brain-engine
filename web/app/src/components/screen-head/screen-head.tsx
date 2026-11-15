import { css } from "@linaria/core";
import { CaretLeftIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import clsx from "clsx";
import { IconButton } from "@ds/components/icon-button/icon-button.tsx";
import { back } from "@/lib/platform/router.ts";
import { copy } from "@/content/index.ts";

const screenHead = css`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-sm);
  min-height: var(--size-target);
  margin-bottom: var(--space-lg);

  & .screen-title {
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const hasBackStyle = css`
  .${screenHead}& {
    margin-left: calc(-1 * var(--space-sm));
  }
`;

const main = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const kickerText = css`
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const actionBox = css`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-sm);
`;

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
    <header className={clsx(screenHead, hasBack && hasBackStyle)}>
      {hasBack && (
        <IconButton
          icon={CaretLeftIcon}
          label={backLabel}
          onClick={onBack ?? (() => back(fallback))}
        />
      )}
      <div className={main}>
        {kicker && <span className={kickerText}>{kicker}</span>}
        {title && <h1 className="screen-title serif">{title}</h1>}
      </div>
      {action && <div className={actionBox}>{action}</div>}
    </header>
  );
}
