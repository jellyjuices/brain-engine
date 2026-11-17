import { css } from "@linaria/core";
import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { mixGlow } from "../../lib/area-mix.ts";

const pageHeader = css`
  position: relative;
  isolation: isolate;
  padding-top: var(--space-2xl);
`;

const hasGlow = css`
  .${pageHeader}&::before, .${pageHeader}&::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    z-index: -1;
    width: var(--size-glow);
    height: var(--size-glow);
    pointer-events: none;
  }

  .${pageHeader}&::before {
    background: var(--page-glow, var(--glow-corner));
    mask-image: var(--glow-corner-mask);
    opacity: var(--glow-corner-opacity);
  }

  .${pageHeader}&::after {
    background-image: var(--texture-noise);
    mask-image: var(--texture-noise-mask);
  }
`;

const top = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 0 var(--space-lg) var(--space-md);
`;

const kickerText = css`
  margin: 0 0 var(--space-xs);
  font-size: var(--font-size-body-sm);
  color: var(--text-secondary);
`;

const titleText = css`
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--font-size-display-2xl);
  font-weight: var(--font-weight-regular);
  line-height: var(--font-leading-tight);
  letter-spacing: var(--font-tracking-tight);
`;

export type PageHeaderProps = {
  title: string;
  kicker?: string;
  action?: ReactNode;
  glow?: boolean;
  children?: ReactNode;
  areas?: string[];
};

export const PageHeader = ({
  title,
  kicker,
  action,
  glow = true,
  children,
  areas,
}: PageHeaderProps) => (
  <header
    className={clsx(pageHeader, glow && hasGlow)}
    style={areas?.length ? ({ "--page-glow": mixGlow(areas) } as CSSProperties) : undefined}
  >
    <div className={top}>
      <div>
        {kicker && <p className={kickerText}>{kicker}</p>}
        <h1 className={titleText}>{title}</h1>
      </div>
      {action && <div>{action}</div>}
    </div>
    {children}
  </header>
);
