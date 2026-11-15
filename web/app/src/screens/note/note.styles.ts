import { css } from "@linaria/core";

export const pending = css`
  margin: 0 0 var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-body-sm);
`;

export const backlinks = css`
  margin-top: var(--space-xl);
`;

export const version = css`
  margin-bottom: var(--space-sm);
`;

export const versionText = css`
  max-height: 28dvh;
  margin: 0;
  overflow: auto;
  font:
    var(--font-size-body-sm) / 1.5 ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const versionButtons = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
`;

export const editTags = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding-bottom: var(--space-sm);
`;
