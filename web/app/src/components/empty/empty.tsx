import { css } from "@linaria/core";
import clsx from "clsx";
import type { ButtonProps } from "@ds/components/button/button.tsx";

const title = css`
  font-size: var(--font-size-body-xl);
  line-height: 1.2;
  text-align: center;
`;

const empty = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-3xl) var(--space-xl);
  text-align: center;
`;

const small = css`
  .${empty}& {
    align-items: flex-start;
    padding: var(--space-xl) var(--space-sm);
    text-align: left;
  }

  .${empty}& .${title} {
    color: var(--text-secondary);
    font-family: var(--font-body);
    font-size: var(--font-size-body-md);
  }
`;

export interface EmptyProps {
  title: string;
  body?: string;
  size?: Exclude<ButtonProps["size"], "lg">;
}

export function Empty({ title, body, size = "md" }: EmptyProps) {
  return (
    <div className={clsx(empty, size === "sm" && small)}>
      <p className={clsx(title, "serif")}>{title}</p>
      {body && <p className="lede">{body}</p>}
    </div>
  );
}
