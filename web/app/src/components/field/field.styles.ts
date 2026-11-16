import { css } from "@linaria/core";

export const field = css`
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: var(--space-sm);
  min-width: 0;

  & .section-label {
    margin: 0;
  }
`;

export const input = css`
  width: 100%;
  min-height: 56px;
  padding: var(--space-md) var(--space-lg);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--background-secondary);
  color: inherit;
  font: inherit;
  font-size: var(--font-size-body-md);
  resize: none;
  -webkit-appearance: none;
  appearance: none;
  transition: border-color var(--motion-fast) var(--motion-easing);

  &:focus-visible {
    border-color: var(--border-focus);
    outline-offset: 0;
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

export const searchBox = css`
  position: relative;
  display: flex;
  align-items: center;

  & > svg {
    position: absolute;
    left: var(--space-lg);
    width: var(--size-icon);
    height: var(--size-icon);
    color: var(--text-secondary);
    pointer-events: none;
  }
`;

export const pickBox = css`
  position: relative;
  display: flex;
  align-items: center;
`;

export const searchInput = css`
  padding-right: var(--size-target);
  padding-left: calc(var(--space-lg) + var(--size-icon) + var(--space-md));

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

export const searchClear = css`
  position: absolute;
  right: 0;
  display: grid;
  place-items: center;
  width: var(--size-target);
  height: var(--size-target);
  border: 0;
  background: transparent;
  color: var(--text-secondary);

  & svg {
    width: var(--size-icon-sm);
    height: var(--size-icon-sm);
  }
`;

export const pickButton = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding-right: var(--size-target);
  text-align: left;

  & svg {
    flex: none;
    width: var(--size-icon);
    height: var(--size-icon);
    color: var(--text-accent);
  }
`;

export const pickEmpty = css`
  .${pickButton}& {
    color: var(--text-secondary);
  }
`;

export const composer = css`
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: var(--space-sm) 0 var(--space-lg);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: var(--font-size-body-lg);
  line-height: 1.5;
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: var(--text-secondary);
  }

  &:focus-visible {
    outline: none;
  }
`;
