import { css } from "@linaria/core";

export const body = css`
  padding-bottom: var(--space-3xl);
`;

export const group = css`
  margin-top: var(--space-md);
`;

export const list = css`
  margin: 0;
  padding: 0;
  list-style: none;

  & > li + li {
    border-top: var(--size-hair) solid var(--border-primary);
  }
`;

export const more = css`
  padding: var(--space-md) var(--space-sm);
`;
