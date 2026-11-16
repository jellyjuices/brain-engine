import { css } from "@linaria/core";

export const tile = css`
  display: flex;
  gap: var(--space-md);
  min-width: 0;
  min-height: 64px;
  padding: var(--space-md) var(--space-lg);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--background-secondary);
  color: inherit;
  text-align: left;

  &:is(button):active {
    background: var(--background-accent-soft);
  }
`;

export const tileDashed = css`
  .${tile}& {
    border-style: dashed;
    background: transparent;
  }
`;

const choice = css`
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: var(--space-xs);
`;

const labelText = css`
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
`;

const subText = css`
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
`;

import clsx from "clsx";

export interface TileProps {
  label: string;
  sub: string;
  autoFocus?: boolean;
  onClick: () => void;
}

export function Tile({ label, sub, autoFocus, onClick }: TileProps) {
  return (
    <button className={clsx(tile, choice)} type="button" autoFocus={autoFocus} onClick={onClick}>
      <span className={labelText}>{label}</span>
      <span className={subText}>{sub}</span>
    </button>
  );
}
