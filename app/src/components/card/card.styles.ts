import { css } from "@linaria/core";

export const cardType = css`
  flex: none;
  color: var(--muted);
  font-size: var(--t-xs);
  font-weight: 600;
`;

export const cardHead = css`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s1);
  color: inherit;
  text-decoration: none;
`;

export const cardTitle = css`
  font-size: var(--t-xl);
  line-height: 1.2;
`;

export const cardDesc = css`
  margin-top: calc(-1 * var(--s1));
  font-size: var(--t-sm);
`;

export const cardBody = css`
  min-width: 0;

  & p {
    margin: 0 0 var(--s1);
    line-height: 1.35;
  }

  & p:last-child {
    margin-bottom: 0;
  }
`;

export const cardSection = css`
  display: grid;
  gap: var(--s1) var(--s2);
  grid-template-columns: calc(var(--s6) + var(--s3)) 1fr;

  & .section-label {
    margin: var(--s0) 0 0;
  }

  &:has(.list) {
    grid-template-columns: 1fr;
  }
`;

export const cardLink = css`
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
`;

export const cardWhen = css`
  color: var(--muted);
`;
