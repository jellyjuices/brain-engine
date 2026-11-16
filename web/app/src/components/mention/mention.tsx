import { css } from "@linaria/core";

const mention = css`
  color: var(--text-accent);
  text-decoration: none;
`;
import type { ReactNode } from "react";

export function Mention({ name, href }: { name: ReactNode; href?: string }) {
  if (href)
    return (
      <a data-mention className={mention} href={href}>
        @{name}
      </a>
    );
  return (
    <span data-mention className={mention}>
      @{name}
    </span>
  );
}
