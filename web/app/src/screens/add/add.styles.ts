import { css } from "@linaria/core";

export const addHead = css`
  flex: none;

  & .screen-title {
    margin-bottom: var(--space-sm);
  }
`;

export const addAfter = css`
  margin: 0 0 var(--space-sm);
`;

export const addTarget = css`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
`;

export const waitingLink = css`
  margin-left: auto;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
`;

export const addMeta = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  padding-bottom: var(--space-sm);
`;

export const addHere = css`
  margin: var(--space-xl) 0;
`;
