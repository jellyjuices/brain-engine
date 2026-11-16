import { css } from "@linaria/core";
import { lists } from "@/components/row/row.styles.ts";

export const cardHead = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
  color: inherit;
  text-decoration: none;
`;

export const cardTitle = css`
  font-size: var(--font-size-body-xl);
  line-height: 1.2;
`;

export const cardDesc = css`
  margin-top: calc(-1 * var(--space-sm));
  font-size: var(--font-size-body-sm);
`;

export const cardBody = css`
  min-width: 0;

  & p {
    margin: 0 0 var(--space-sm);
    line-height: 1.35;
  }

  & p:last-child {
    margin-bottom: 0;
  }
`;

export const cardSec = css`
  display: grid;
  gap: var(--space-sm) var(--space-lg);
  grid-template-columns: calc(var(--space-3xl) + var(--space-xl)) 1fr;

  & .section-label {
    margin: var(--space-xs) 0 0;
  }

  &:has(.${lists.ghost}) {
    grid-template-columns: 1fr;
  }
`;

export const cardLink = css`
  color: var(--text-accent);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
`;

export const cardWhen = css`
  color: var(--text-secondary);
`;
