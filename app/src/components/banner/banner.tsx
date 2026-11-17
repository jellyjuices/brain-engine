import { css } from "@linaria/core";
import { TrayIcon } from "@phosphor-icons/react";
import { Button } from "../button/button.tsx";

const banner = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-md) var(--space-md) var(--space-lg);
  border-radius: var(--radius-card);
  background: var(--background-accent-soft);
  color: var(--text-accent);
`;

const icon = css`
  flex: none;
  width: var(--size-icon);
  height: var(--size-icon);
`;

const count = css`
  margin-right: var(--space-xs);
  font-family: var(--font-number);
  font-weight: var(--font-weight-bold);
`;

const message = css`
  flex: 1;
  margin: 0;
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-medium);
`;

export type BannerProps = {
  message: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export const Banner = ({ message: text, count: total, actionLabel, onAction }: BannerProps) => (
  <div className={banner} role="status">
    <TrayIcon aria-hidden className={icon} />
    <p className={message}>
      {total !== undefined && <span className={count}>{total}</span>}
      {text}
    </p>
    {actionLabel && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);
