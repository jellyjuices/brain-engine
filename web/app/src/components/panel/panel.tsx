import { css } from "@linaria/core";

export const panel = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding: var(--space-lg);
  border: var(--size-hair) solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--background-secondary);
`;
import type { ReactNode } from "react";

export function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={panel} aria-label={label}>
      {children}
    </section>
  );
}
