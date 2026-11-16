import { css } from "@linaria/core";

export const noteTitle = css`
  font-size: var(--font-size-display-xl);
  line-height: 1.05;
  text-wrap: balance;
`;

export const noteWho = css`
  margin-top: var(--space-sm);
  font-family: var(--font-display);
  font-size: var(--font-size-body-lg);
  line-height: 1.35;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm) var(--space-md);
`;

export const noteNick = css`
  font-style: italic;
`;

export const noteDesc = css`
  margin: var(--space-lg) 0 0;
  color: var(--text-secondary);
  font-family: var(--font-display);
  font-size: var(--font-size-body-md);
  line-height: 1.45;
  text-wrap: pretty;
`;

export const noteIntro = css`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-xl);

  & > .section-label {
    margin: 0 0 var(--space-sm);
  }
`;

export const facts = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin: var(--space-lg) 0 0;
`;

export const fact = css`
  flex: 1 1 200px;
  align-items: center;

  & .section-label {
    margin: 0;
  }
`;

export const factAddLabel = css`
  color: var(--text-accent);
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
`;

export const factIcon = css`
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--background-accent-soft);
  color: var(--text-accent);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

export const factText = css`
  display: flex;
  flex-direction: column;
  gap: var(--size-hair);
  min-width: 0;
`;

export const factSub = css`
  color: var(--text-secondary);
  font-family: var(--font-body);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-regular);
`;

export const factMain = css`
  display: flex;
  flex-direction: column;
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

export const factLink = css`
  color: var(--text-accent);
  text-decoration: none;
`;
