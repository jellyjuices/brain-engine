import { css } from "@linaria/core";
import type { ReactNode } from "react";

const toolBar = css`
  flex: none;
  margin: 0 calc(-1 * (var(--space-lg) + env(safe-area-inset-right))) 0
    calc(-1 * (var(--space-lg) + env(safe-area-inset-left)));
  padding: var(--space-sm) calc(var(--space-lg) + env(safe-area-inset-right)) var(--space-sm)
    calc(var(--space-lg) + env(safe-area-inset-left));
  border-top: var(--size-hair) solid var(--border-primary);
  background: var(--background-secondary);
`;

const tools = css`
  display: flex;
`;

export function ToolBar({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={toolBar}>
      {meta}
      <div className={tools} role="toolbar" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
