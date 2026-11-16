import { css } from "@linaria/core";

const menuList = css`
  margin: 0 calc(-1 * var(--space-lg));
`;

const ghostList = css`
  margin: 0 calc(-1 * var(--space-lg));
`;

const outlinedList = css`
  overflow: hidden;
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--background-secondary);
`;

export const lists = { outlined: outlinedList, ghost: ghostList, menu: menuList };

export const list = css`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  &:not(:has(> :not([hidden]))) {
    display: none;
  }

  &:not(.${menuList}) > :not(:first-child) {
    border-top: var(--size-hair) solid var(--border-primary);
  }
`;

export const divider = css`
  flex: none;
  height: 0;
  margin: var(--space-xs) 0;
  border: 0;
  border-top: var(--size-hair) solid var(--border-primary);
`;

export const rowIcon = css`
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--background-primary);
  color: var(--text-primary);

  & svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

export const rowMain = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
`;

export const rowTitle = css`
  font-size: var(--font-size-body-md);
  font-weight: var(--font-weight-regular);
  line-height: 1.3;
  overflow-wrap: anywhere;
`;

export const rowSub = css`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
  font-weight: var(--font-weight-regular);
  line-height: 1.35;
`;

export const rowEnd = css`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-body-xs);
  font-weight: var(--font-weight-semibold);

  & > svg {
    width: var(--size-icon);
    height: var(--size-icon);
  }
`;

export const row = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  width: 100%;
  min-height: 56px;
  padding: var(--space-md) var(--space-lg);
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  text-decoration: none;

  &[hidden] {
    display: none;
  }

  &:is(a, button):active {
    background: var(--background-accent-soft);
  }
`;

export const rowVariants = {
  default: "",
  primary: css`
    .${row}& .${rowIcon} {
      background: var(--background-accent);
      color: var(--text-on-accent);
    }

    .${row}& .${rowTitle} {
      color: var(--text-accent);
    }
  `,
  danger: css`
    .${row}& .${rowIcon} {
      background: color-mix(in srgb, var(--text-danger) 12%, transparent);
      color: var(--text-danger);
    }

    .${row}& .${rowTitle} {
      color: var(--text-danger);
    }
  `,
};

export const rowBusy = css`
  .${row}& .${rowMain} {
    opacity: 0.5;
  }

  .${row}& .${rowEnd} > svg {
    animation: spin 0.8s linear infinite;
  }
`;
