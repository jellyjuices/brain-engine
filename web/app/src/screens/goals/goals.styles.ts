import { css } from "@linaria/core";

export const body = css`
  display: grid;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-md) var(--space-3xl);
`;

export const card = css`
  display: grid;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-radius: var(--radius-card);
  background: var(--background-secondary);
`;

export const title = css`
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-display-sm);
  font-weight: var(--font-weight-regular);

  & a {
    color: var(--text-primary);
    text-decoration: none;
  }
`;

export const list = css`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const sub = css`
  display: grid;
  gap: var(--space-xs);
  padding-left: var(--space-md);
  color: var(--text-primary);
  text-decoration: none;
  font-size: var(--font-size-body-sm);
`;
