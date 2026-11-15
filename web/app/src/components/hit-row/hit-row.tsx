import { css } from "@linaria/core";
import { cardType } from "@/components/card/card-type.ts";
import type { MouseEvent } from "react";
import { noteHref } from "@/lib/notes/model.ts";

const hit = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-height: 56px;
  justify-content: center;
  padding: var(--space-md) var(--space-lg);
  border-top: var(--size-hair) solid var(--border-primary);
  color: inherit;
  text-decoration: none;

  &:active {
    background: var(--background-accent-soft);
  }
`;

const top = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
`;

const hitTitle = css`
  font-weight: var(--font-weight-semibold);
`;

const hitSub = css`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  line-height: 1.35;
`;

export interface HitRowProps {
  path: string;
  title: string;
  type?: string;
  sub?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function HitRow({ path, title, type, sub, onClick }: HitRowProps) {
  return (
    <a className={hit} href={noteHref(path)} onClick={onClick}>
      <span className={top}>
        <span className={hitTitle}>{title}</span>
        {type && <span className={cardType}>{type}</span>}
      </span>
      {sub && <span className={hitSub}>{sub}</span>}
    </a>
  );
}
