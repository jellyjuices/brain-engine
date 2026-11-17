import { css } from "@linaria/core";

export const body = css`
  display: grid;
  gap: var(--space-xl);
  padding: var(--space-md) var(--space-md) var(--space-3xl);
`;

export const why = css`
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-body-md);
`;

export const list = css`
  margin: 0;
  padding: 0;
  list-style: none;

  & > li + li {
    border-top: var(--size-hair) solid var(--border-primary);
  }
`;

export const subs = css`
  display: grid;
  gap: var(--space-md);
`;
