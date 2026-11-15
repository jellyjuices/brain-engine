import { css } from "@linaria/core";
import type { ReactNode } from "react";
import clsx from "clsx";
import { Rail } from "@/shell/rail/rail.tsx";
import { MAIN_ID, SkipLink } from "@/shell/skip-link/skip-link.tsx";
import { TabBar } from "@/shell/tab-bar/tab-bar.tsx";
import { TopBar } from "@/shell/top-bar/top-bar.tsx";
import { UnsortedBanner } from "@/shell/unsorted-banner/unsorted-banner.tsx";
import { useShellLayout } from "@/shell/use-shell-layout.ts";

const shellMain = css`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;

  &:focus {
    outline: none;
  }
`;

const layouts = {
  wide: css`
    flex-direction: row;

    & .screen {
      padding-left: var(--space-2xl);
      padding-right: calc(var(--space-2xl) + env(safe-area-inset-right));
    }
  `,
  popover: css`
    & .screen {
      padding: var(--space-lg);
    }
  `,
  phone: "",
};

export function ShellFrame({ children }: { children: ReactNode }) {
  const layout = useShellLayout();
  const wide = layout === "wide";
  return (
    <div className={clsx("shell", `shell--${layout}`, layouts[layout])}>
      <SkipLink />
      {wide && <Rail />}
      <div id={MAIN_ID} className={shellMain} tabIndex={-1}>
        {!wide && <TopBar />}
        <UnsortedBanner />
        {children}
      </div>
      {!wide && <TabBar />}
    </div>
  );
}
