import { css } from "@linaria/core";

export const mdHeading = css`
  margin: var(--space-xl) 0 var(--space-sm);
  font-family: var(--font-display);
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;

  h2& {
    margin-top: var(--space-2xl);
    padding-top: var(--space-lg);
    border-top: var(--size-hair) solid var(--border-primary);
    font-size: var(--font-size-body-xl);
  }

  h3& {
    margin-top: var(--space-xl);
    font-size: var(--font-size-body-lg);
  }

  h4&,
  h5& {
    font-family: var(--font-body);
    font-size: var(--font-size-body-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }
`;

export const mdNoteLink = css`
  color: var(--text-accent);
  text-decoration-thickness: var(--size-hair);
  text-underline-offset: 3px;
`;

export const md = css`
  overflow-wrap: anywhere;
  font-size: var(--font-size-body-md);
  line-height: 1.55;

  & p,
  & ul,
  & ol,
  & blockquote,
  & pre {
    margin: 0 0 var(--space-sm);
  }

  & ul,
  & ol {
    padding-left: var(--space-xl);
  }

  & li {
    margin: var(--space-xs) 0;
  }

  & a {
    color: var(--text-accent);
    text-decoration-thickness: var(--size-hair);
    text-underline-offset: 3px;
  }

  & code {
    padding: var(--size-hair) var(--space-xs);
    border-radius: var(--radius-sm);
    background: var(--background-accent-soft);
    font-size: 0.92em;
  }

  & pre {
    padding: var(--space-lg);
    overflow-x: auto;
    border: var(--size-hair) solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--background-secondary);
  }

  & pre code {
    padding: 0;
    background: none;
  }

  & blockquote {
    padding-left: var(--space-lg);
    border-left: 3px solid var(--border-primary);
    color: var(--text-secondary);
  }

  & hr {
    margin: var(--space-lg) 0;
    border: 0;
    border-top: var(--size-hair) solid var(--border-primary);
  }

  & p {
    text-wrap: pretty;
  }

  & > h2.${mdHeading}:first-child {
    margin-top: var(--space-sm);
  }
`;

export const mdList = css`
  margin: 0 0 var(--space-sm);
`;

export const mdCheckText = css`
  --md-check-text: 1;
`;

export const mdCheck = css`
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-height: 56px;
  padding: var(--space-md) var(--space-lg);
`;

export const mdCheckDone = css`
  .${mdCheck}& .${mdCheckText} {
    color: var(--text-secondary);
    text-decoration: line-through;
  }
`;

export const mdBox = css`
  flex: none;
  width: var(--size-icon);
  height: var(--size-icon);
  margin-top: var(--space-xs);
  border: var(--size-focus) solid var(--text-secondary);
  border-radius: var(--radius-sm);
`;

export const mdBoxOn = css`
  .${mdBox}& {
    border-color: var(--border-focus);
    background: var(--background-accent) center / 14px no-repeat
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' fill='white'%3E%3Cpath d='M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z'/%3E%3C/svg%3E");
  }
`;
