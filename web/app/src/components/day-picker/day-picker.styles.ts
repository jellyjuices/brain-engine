import { css } from "@linaria/core";

export const dp = css`
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
`;

export const head = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
`;

export const title = css`
  flex: 1;
  font-weight: var(--font-weight-semibold);
  text-align: center;
`;

export const nav = css`
  display: grid;
  place-items: center;
  width: var(--size-control);
  height: var(--size-control);
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-primary);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }

  &:disabled {
    opacity: 0.3;
  }
`;

export const year = css`
  .${nav}& {
    width: calc(var(--size-control) + var(--space-sm));
  }

  .${nav}& svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }
`;

export const week = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;

  & span {
    color: var(--text-secondary);
    font-size: var(--font-size-body-xs);
    font-weight: var(--font-weight-semibold);
    padding: var(--space-xs) 0;
  }
`;

export const grid = css`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
`;

export const day = css`
  height: var(--size-control);
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-primary);
  font-size: var(--font-size-body-md);

  &:active {
    background: var(--background-accent-soft);
  }

  &:disabled {
    color: var(--text-secondary);
    opacity: 0.4;
  }
`;

export const isToday = css`
  .${day}& {
    color: var(--text-accent);
    font-weight: var(--font-weight-semibold);
  }
`;

export const isPicked = css`
  .${day}& {
    background: var(--background-accent);
    color: var(--text-on-accent);
    font-weight: var(--font-weight-semibold);
  }
`;
