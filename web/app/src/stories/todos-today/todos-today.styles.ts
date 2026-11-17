import { css } from "@linaria/core";

export const screen = css`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: var(--size-max-width);
  margin: 0 auto;
  background: var(--background-primary);
`;

export const main = css`
  flex: 1;
  padding-bottom: var(--space-3xl);
`;

export const banner = css`
  padding: var(--space-lg) var(--space-lg) 0;
`;

export const list = css`
  margin: 0;
  padding: 0;

  & > li + li {
    border-top: var(--size-hair) solid var(--border-primary);
  }
`;

export const more = css`
  padding: var(--space-md) var(--space-sm);
`;

export const tabs = css`
  position: sticky;
  bottom: 0;
`;

export const actions = css`
  display: flex;
`;
